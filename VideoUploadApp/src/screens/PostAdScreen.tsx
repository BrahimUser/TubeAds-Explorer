import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Camera,
  type CameraRef,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  useVideoOutput,
} from 'react-native-vision-camera';
import type { Recorder } from 'react-native-vision-camera';
import type { StackScreenProps } from '@react-navigation/stack';
import { Button } from '../components/Button';
import { Dropdown } from '../components/Dropdown';
import {
  DEFAULT_CURRENCY,
  MAX_RECORDING_SECONDS,
} from '../config/constants';
import {
  CATEGORIES,
  CITIES,
  categoryFirestoreValue,
  type CategoryId,
  type CityId,
} from '../config/marketplace';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import { createAd } from '../services/listings';
import { colors, radii, spacing, typography } from '../theme';
import { uploadVideoToYoutubeViaBackend, youtubeThumbnailUrl } from '../services/youtube';

type CameraPosition = 'back' | 'front';

type PublishStatus =
  | 'idle'
  | 'uploading'
  | 'saving-listing'
  | 'done'
  | 'error';

type Props = StackScreenProps<RootStackParamList, 'PostAd'>;

/**
 * "Post a new ad" screen.
 *
 * Flow:
 *   1. User fills in title / description / price.
 *   2. User records up to MAX_RECORDING_SECONDS of video.
 *   3. User taps "Publish":
 *      a. getYoutubeAccessToken() → Google OAuth for YouTube (account picker if
 *         needed; Firebase uid stays the signed-in marketplace user)
 *      b. uploadVideoToYouTube(...) → returns YouTube id
 *      c. createAd({...})     → writes Firestore document (listings)
 *      d. Alert then navigation.goBack() → Home feed updates live for approved listings
 *
 * The camera/recording plumbing is unchanged from the original `App.tsx` —
 * only the upload terminus changed (Firestore write instead of YouTube
 * playlist insert).
 */
export function PostAdScreen({ navigation }: Props) {
  // --- Auth gate ------------------------------------------------------------
  // Anyone can navigate here (deep link, accidental nav), but only signed-in
  // users may stay. We bounce unauthenticated visitors to the Auth screen so
  // the gate is enforced visually, not just at publish time.
  const { user, initializing } = useAuthUser();
  useEffect(() => {
    if (!initializing && !user) {
      navigation.replace('Auth', { mode: 'sign-in' });
    }
  }, [initializing, user, navigation]);

  // --- Form state -----------------------------------------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  /** User-typed price, e.g. "1234.50". Validated/parsed at publish time. */
  const [priceText, setPriceText] = useState('');
  /**
   * Avito-style structured fields. Both must be picked before Publish
   * unlocks (see `canPublish` below). We default to `null` instead of an
   * arbitrary first option so an unselected dropdown reads as "needs
   * input" rather than silently defaulting to "Rugs in Casablanca".
   */
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [city, setCity] = useState<CityId | null>(null);

  // --- Camera state ---------------------------------------------------------
  const cameraRef = useRef<CameraRef>(null);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
  const device = useCameraDevice(cameraPosition);

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } =
    useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } =
    useMicrophonePermission();
  const permissionsGranted = hasCameraPermission && hasMicPermission;

  const videoOutput = useVideoOutput({
    targetResolution: CommonResolutions.HD_16_9,
    enableAudio: true,
    enablePersistentRecorder: true,
  });
  const outputs = useMemo(() => [videoOutput], [videoOutput]);

  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isRecording, setIsRecording] = useState(false);
  const [lastVideo, setLastVideo] = useState<{ path: string } | null>(null);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState<number | null>(null);

  // --- Publish state --------------------------------------------------------
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishMessage, setPublishMessage] = useState('');

  const recorderRef = useRef<Recorder | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cameraStartedRef = useRef(false);
  const cameraStartListenersRef = useRef<Array<() => void>>([]);

  const clearRecordingTimers = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
    setRecordingSecondsLeft(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!hasCameraPermission) await requestCameraPermission();
        if (!hasMicPermission) await requestMicPermission();
      } catch {
        // user can retry via the in-UI button
      }
    })();
  }, [hasCameraPermission, hasMicPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => setAppState(next));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => clearRecordingTimers();
  }, [clearRecordingTimers]);

  const isPublishInFlight =
    publishStatus === 'uploading' ||
    publishStatus === 'saving-listing';

  const onCameraError = useCallback((error: Error) => {
    Alert.alert('Camera error', String(error?.message ?? error));
  }, []);

  const onCameraStarted = useCallback(() => {
    cameraStartedRef.current = true;
    const listeners = cameraStartListenersRef.current;
    cameraStartListenersRef.current = [];
    listeners.forEach((l) => l());
  }, []);

  const onCameraStopped = useCallback(() => {
    cameraStartedRef.current = false;
  }, []);

  const awaitCameraStart = useCallback((timeoutMs = 8000) => {
    if (cameraStartedRef.current) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const handler = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        cameraStartListenersRef.current = cameraStartListenersRef.current.filter(
          (l) => l !== handler,
        );
        reject(new Error('Timed out waiting for camera to start.'));
      }, timeoutMs);
      cameraStartListenersRef.current.push(handler);
    });
  }, []);

  const stopRecordingSafely = useCallback(async () => {
    try {
      await recorderRef.current?.stopRecording();
    } catch {
      // already stopped or not recording
    }
  }, []);

  const onPressFlip = useCallback(() => {
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'));
  }, []);

  const ensurePermissions = useCallback(async () => {
    let camOk = hasCameraPermission;
    let micOk = hasMicPermission;
    if (!camOk) camOk = await requestCameraPermission();
    if (!micOk) micOk = await requestMicPermission();
    if (!camOk || !micOk) {
      Alert.alert(
        'Permissions required',
        'Open Settings and grant Camera and Microphone permissions, then try again.',
      );
      return false;
    }
    return true;
  }, [hasCameraPermission, hasMicPermission, requestCameraPermission, requestMicPermission]);

  const onPressRecord = async () => {
    if (isRecording) {
      clearRecordingTimers();
      await stopRecordingSafely();
      return;
    }

    const ok = await ensurePermissions();
    if (!ok) return;

    if (!device) {
      Alert.alert('No camera available', 'Could not find a camera at the requested position.');
      return;
    }

    setLastVideo(null);
    cameraStartedRef.current = false;

    setIsRecording(true);
    setRecordingSecondsLeft(MAX_RECORDING_SECONDS);

    try {
      await awaitCameraStart();

      const recorder = await videoOutput.createRecorder({
        maxDuration: MAX_RECORDING_SECONDS,
      });
      recorderRef.current = recorder;

      await recorder.startRecording(
        (filePath) => {
          clearRecordingTimers();
          setLastVideo({ path: filePath });
          recorderRef.current = null;
          setIsRecording(false);
        },
        (error) => {
          clearRecordingTimers();
          recorderRef.current = null;
          setIsRecording(false);
          Alert.alert('Recording error', String(error?.message ?? error));
        },
      );

      stopTimerRef.current = setTimeout(() => {
        stopRecordingSafely();
      }, MAX_RECORDING_SECONDS * 1000);

      tickIntervalRef.current = setInterval(() => {
        setRecordingSecondsLeft((prev) => (prev === null ? null : Math.max(0, prev - 1)));
      }, 1000);
    } catch (e) {
      clearRecordingTimers();
      recorderRef.current = null;
      setIsRecording(false);
      Alert.alert('Could not start recording', String((e as Error)?.message ?? e));
    }
  };

  useEffect(() => {
    if (appState !== 'active' && isRecording) {
      clearRecordingTimers();
      stopRecordingSafely();
    }
  }, [appState, isRecording, clearRecordingTimers, stopRecordingSafely]);

  /**
   * Parse the user-typed price into integer cents.
   * Returns null if the input is missing/invalid/non-positive.
   *
   * Accepts both "." and "," as decimal separators (Avito's user base
   * uses comma; numeric keypads on iOS only emit ".").
   */
  const parsePriceToCents = (raw: string): number | null => {
    const normalized = raw.trim().replace(/\s+/g, '').replace(',', '.');
    if (!normalized) return null;
    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value * 100);
  };

  const canPublish = useMemo(() => {
    if (isPublishInFlight) return false;
    if (!lastVideo?.path) return false;
    if (title.trim().length < 3) return false;
    if (description.trim().length < 5) return false;
    if (parsePriceToCents(priceText) === null) return false;
    // Category & city are mandatory — Avito-style listings always
    // need both for browse/filter to work. We block Publish here AND
    // double-check in `handlePublish` so a programmatic call (deep
    // link, automated test) can't bypass the gate.
    if (!category) return false;
    if (!city) return false;
    return true;
  }, [
    isPublishInFlight,
    lastVideo?.path,
    title,
    description,
    priceText,
    category,
    city,
  ]);

  /** Full publish pipeline: YouTube upload → Firestore listing (no Firebase Storage). */
  const handlePublish = async () => {
    if (!lastVideo?.path) return;
    if (!user) {
      // Belt-and-braces: useEffect already redirected, but guard the
      // happy path too in case the user races the redirect.
      navigation.replace('Auth', { mode: 'sign-in' });
      return;
    }
    const priceCents = parsePriceToCents(priceText);
    if (priceCents === null) {
      Alert.alert('Invalid price', 'Enter a positive number, e.g. 1500 or 1500.00.');
      return;
    }
    if (!category || !city) {
      // The Publish button should already be disabled in this state,
      // but this guards a programmatic call (and narrows the type
      // for `createAd(...)` below).
      Alert.alert(
        'Missing information',
        'Please select a category and a city before publishing.',
      );
      return;
    }

    try {
      setPublishStatus('uploading');
      setPublishMessage('Uploading to YouTube…');

      const { youtubeVideoId } = await uploadVideoToYoutubeViaBackend({
        filePath: lastVideo.path,
        title: title.trim(),
        description: description.trim(),
      });
      if (!youtubeVideoId) {
        throw new Error('YouTube did not return a video id.');
      }

      setPublishStatus('saving-listing');
      setPublishMessage('Saving to Firestore…');

      const adId = await createAd({
        title: title.trim(),
        description: description.trim(),
        priceCents,
        currency: DEFAULT_CURRENCY,
        category: categoryFirestoreValue(category),
        city,
        youtubeVideoId,
        thumbnailUrl: youtubeThumbnailUrl(youtubeVideoId),
      });

      setPublishStatus('done');
      setPublishMessage(`Submitted (${adId}).`);
      Alert.alert(
        'Submitted for review',
        'Your ad will appear in the marketplace after an admin approves it, same as on the website.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      setPublishStatus('error');
      setPublishMessage(String((e as Error)?.message ?? e));
      Alert.alert('Could not publish', String((e as Error)?.message ?? e));
    }
  };

  const flipLabel = cameraPosition === 'back' ? 'Flip → Front' : 'Flip → Back';

  // Guard render: while we're either checking auth or about to redirect
  // a logged-out user, paint a minimal placeholder so the form + camera
  // don't briefly flash on screen.
  if (initializing || !user) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form -------------------------------------------------------- */}
        <View style={styles.fieldGroup}>
          <Text style={styles.screenTitle}>New ad</Text>
          <Text style={styles.screenSubtitle}>
            Tell buyers what you're selling. All fields are required.
          </Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Handmade Beni Ourain rug 2x3m"
            placeholderTextColor={colors.textDim}
            maxLength={80}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Condition, dimensions, accessories included…"
            placeholderTextColor={colors.textDim}
            multiline
            maxLength={500}
          />

          <Text style={styles.label}>Price ({DEFAULT_CURRENCY})</Text>
          <TextInput
            style={styles.input}
            value={priceText}
            onChangeText={setPriceText}
            placeholder="1500"
            placeholderTextColor={colors.textDim}
            keyboardType="decimal-pad"
            inputMode="decimal"
          />

          {/* Structured fields — required for browse/filter to work. */}
          <View style={styles.dropdownSpacer} />
          <Dropdown<CategoryId>
            label="Category"
            value={category}
            options={CATEGORIES}
            onChange={setCategory}
            placeholder="Select a category"
          />

          <View style={styles.dropdownSpacer} />
          <Dropdown<CityId>
            label="City"
            value={city}
            options={CITIES}
            onChange={setCity}
            placeholder="Select a city"
          />
        </View>

        {/* Camera preview --------------------------------------------- */}
        <View style={styles.preview}>
          {isRecording && device && permissionsGranted ? (
            <Camera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isRecording}
              outputs={outputs}
              resizeMode="cover"
              onError={onCameraError}
              onStarted={onCameraStarted}
              onStopped={onCameraStopped}
            />
          ) : (
            <View style={styles.center}>
              <Text style={styles.previewTitle}>
                {lastVideo?.path ? 'Video recorded' : 'Camera off'}
              </Text>
              <Text style={styles.previewSubtitle}>
                {!device
                  ? `No ${cameraPosition} camera found on this device.`
                  : !permissionsGranted
                  ? 'Camera or microphone permission is missing.'
                  : lastVideo?.path
                  ? 'Tap Record again to retake.'
                  : 'Press Record to start the camera.'}
              </Text>
              <Text style={styles.previewHint}>{`Camera: ${cameraPosition}`}</Text>
              {!permissionsGranted && (
                <Button
                  label="Grant permissions"
                  variant="secondary"
                  onPress={async () => {
                    await requestCameraPermission();
                    await requestMicPermission();
                  }}
                  style={styles.permissionButton}
                />
              )}
            </View>
          )}

          {isRecording && (
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                REC{recordingSecondsLeft !== null ? ` · ${recordingSecondsLeft}s` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Camera controls -------------------------------------------- */}
        <View style={styles.controls}>
          <Button
            label={flipLabel}
            variant="secondary"
            onPress={onPressFlip}
            style={styles.flipButton}
          />
          <Button
            label={
              isRecording
                ? `Stop${recordingSecondsLeft !== null ? ` (${recordingSecondsLeft}s)` : ''}`
                : 'Record'
            }
            variant={isRecording ? 'danger' : 'primary'}
            onPress={onPressRecord}
            style={styles.recordButton}
          />
        </View>

        {/* Publish ---------------------------------------------------- */}
        <Button
          label="Publish ad"
          variant="success"
          size="lg"
          disabled={!canPublish}
          loading={isPublishInFlight}
          loadingLabel={
            publishStatus === 'uploading'
              ? 'Uploading to YouTube…'
              : publishStatus === 'saving-listing'
                ? 'Saving to Firestore…'
                : undefined
          }
          onPress={handlePublish}
        />

        <View style={styles.statusRow}>
          {isPublishInFlight && <ActivityIndicator color={colors.secondary} />}
          <Text style={styles.statusText}>
            {publishMessage ||
              (lastVideo?.path
                ? `Recorded: ${lastVideo.path.split('/').pop()}`
                : isRecording
                ? `Recording… max ${MAX_RECORDING_SECONDS}s`
                : 'Fill in the form and record a video.')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  fieldGroup: { gap: spacing.xs + 2 },
  screenTitle: { ...typography.display, color: colors.text },
  screenSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dropdownSpacer: { height: spacing.xs },
  label: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs + 2,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  preview: {
    height: 240,
    borderRadius: radii.md,
    overflow: 'hidden',
    // Soft surface in the placeholder state ("Camera off"). When the
    // user starts recording, the <Camera /> view fills this absolutely
    // with its own black/video frame, so this color is only visible
    // when the camera isn't active — and dark text on it stays legible.
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xs,
  },
  previewTitle: { ...typography.title, color: colors.text },
  previewSubtitle: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  previewHint: { ...typography.caption, color: colors.textDim },
  controls: { flexDirection: 'row', gap: spacing.sm },
  flipButton: { flex: 1 },
  recordButton: { flex: 1.4 },
  permissionButton: { marginTop: spacing.md, alignSelf: 'stretch' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: { flex: 1, ...typography.caption, color: colors.textMuted },
  recordingBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.scrim,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  recordingText: { ...typography.label, color: '#FFFFFF' },
});

export default PostAdScreen;
