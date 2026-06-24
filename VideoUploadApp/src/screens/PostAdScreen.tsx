import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  type AppStateStatus,
  Dimensions,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
type CameraMode = 'form' | 'shorts';

type PublishStatus =
  | 'idle'
  | 'uploading'
  | 'saving-listing'
  | 'done'
  | 'error';

type Props = StackScreenProps<RootStackParamList, 'PostAd'>;

function showPermissionSettingsAlert() {
  Alert.alert(
    'Permissions required',
    'Camera and microphone access are needed to record your listing video. Enable them in Settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

/**
 * "Post a new ad" screen.
 *
 * Flow:
 *   1. User fills in title / description / price.
 *   2. User records up to MAX_RECORDING_SECONDS of video (Shorts-style full screen).
 *   3. User taps "Publish":
 *      a. getYoutubeAccessToken() → Google OAuth for YouTube
 *      b. uploadVideoToYouTube(...) → returns YouTube id
 *      c. createAd({...})     → writes Firestore document (listings)
 *      d. Alert then navigation.goBack()
 */
export function PostAdScreen({ navigation }: Props) {
  const { user, initializing } = useAuthUser();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!initializing && !user) {
      navigation.replace('Auth', { mode: 'sign-in' });
    }
  }, [initializing, user, navigation]);

  // --- Form state -----------------------------------------------------------
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [city, setCity] = useState<CityId | null>(null);

  // --- Camera state ---------------------------------------------------------
  const cameraRef = useRef<CameraRef>(null);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>('back');
  const [cameraMode, setCameraMode] = useState<CameraMode>('form');
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

  const cameraShouldBeActive =
    isFocused && appState === 'active' && permissionsGranted && Boolean(device);

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
    if (isRecording) return;
    setCameraPosition((p) => (p === 'back' ? 'front' : 'back'));
  }, [isRecording]);

  const ensurePermissions = useCallback(async () => {
    let camOk = hasCameraPermission;
    let micOk = hasMicPermission;
    if (!camOk) camOk = await requestCameraPermission();
    if (!micOk) micOk = await requestMicPermission();
    if (!camOk || !micOk) {
      showPermissionSettingsAlert();
      return false;
    }
    return true;
  }, [hasCameraPermission, hasMicPermission, requestCameraPermission, requestMicPermission]);

  const onRequestPermissions = useCallback(async () => {
    const camOk = await requestCameraPermission();
    const micOk = await requestMicPermission();
    if (!camOk || !micOk) {
      showPermissionSettingsAlert();
    }
  }, [requestCameraPermission, requestMicPermission]);

  const onPressOpenShorts = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;

    if (!device) {
      Alert.alert('No camera available', 'Could not find a camera at the requested position.');
      return;
    }

    setCameraMode('shorts');
  };

  const onPressCloseShorts = useCallback(() => {
    if (isRecording) return;
    setCameraMode('form');
  }, [isRecording]);

  const onPressRecordToggle = async () => {
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
          setCameraMode('form');
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

  useEffect(() => {
    if (cameraMode === 'form' && isRecording) {
      clearRecordingTimers();
      stopRecordingSafely();
      setIsRecording(false);
    }
  }, [cameraMode, isRecording, clearRecordingTimers, stopRecordingSafely]);

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

  const handlePublish = async () => {
    if (!lastVideo?.path) return;
    if (!user) {
      navigation.replace('Auth', { mode: 'sign-in' });
      return;
    }
    const priceCents = parsePriceToCents(priceText);
    if (priceCents === null) {
      Alert.alert('Invalid price', 'Enter a positive number, e.g. 1500 or 1500.00.');
      return;
    }
    if (!category || !city) {
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

  const renderCamera = (active: boolean) => {
    if (!device || !permissionsGranted) return null;
    return (
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={active && cameraShouldBeActive}
        outputs={outputs}
        resizeMode="cover"
        onError={onCameraError}
        onStarted={onCameraStarted}
        onStopped={onCameraStopped}
      />
    );
  };

  if (initializing || !user) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={colors.secondary} />
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
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

          <View style={styles.preview}>
            {permissionsGranted && device ? (
              <>
                {cameraMode === 'form' && renderCamera(true)}
                {lastVideo?.path && !isRecording && (
                  <View style={styles.recordedOverlay}>
                    <Text style={styles.recordedOverlayText}>Video recorded</Text>
                    <Text style={styles.recordedOverlayHint}>Tap Record to retake</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.center}>
                <Text style={styles.previewTitle}>
                  {lastVideo?.path ? 'Video recorded' : 'Camera access needed'}
                </Text>
                <Text style={styles.previewSubtitle}>
                  {!device
                    ? `No ${cameraPosition} camera found on this device.`
                    : 'Allow camera and microphone to preview and record your listing video.'}
                </Text>
                {!permissionsGranted && (
                  <View style={styles.permissionActions}>
                    <Button
                      label="Grant permissions"
                      variant="secondary"
                      onPress={onRequestPermissions}
                      style={styles.permissionButton}
                    />
                    <Button
                      label="Open Settings"
                      variant="ghost"
                      onPress={() => Linking.openSettings()}
                      style={styles.permissionButton}
                    />
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.controls}>
            <Button
              label={flipLabel}
              variant="secondary"
              onPress={onPressFlip}
              disabled={!permissionsGranted || isRecording}
              style={styles.flipButton}
            />
            <Button
              label={lastVideo?.path ? 'Retake video' : 'Record'}
              variant="primary"
              onPress={onPressOpenShorts}
              disabled={!permissionsGranted}
              style={styles.recordButton}
            />
          </View>

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
                  : `Fill in the form and record a video (up to ${MAX_RECORDING_SECONDS}s).`)}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={cameraMode === 'shorts'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onPressCloseShorts}
      >
        <View style={styles.shortsRoot}>
          {renderCamera(true)}

          <View style={[styles.shortsTopBar, { paddingTop: insets.top + spacing.sm }]}>
            {!isRecording ? (
              <Pressable
                onPress={onPressCloseShorts}
                style={styles.shortsCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close recorder"
              >
                <Text style={styles.shortsCloseText}>✕</Text>
              </Pressable>
            ) : (
              <View style={styles.shortsClosePlaceholder} />
            )}

            {isRecording ? (
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  REC{recordingSecondsLeft !== null ? ` · ${recordingSecondsLeft}s` : ''}
                </Text>
              </View>
            ) : (
              <Text style={styles.shortsHint}>Up to {MAX_RECORDING_SECONDS}s</Text>
            )}
          </View>

          <View style={[styles.shortsBottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Pressable
              onPress={onPressFlip}
              disabled={isRecording}
              style={[styles.shortsFlipButton, isRecording && styles.shortsControlDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <Text style={styles.shortsFlipText}>Flip</Text>
            </Pressable>

            <Pressable
              onPress={onPressRecordToggle}
              style={styles.shortsRecordOuter}
              accessibilityRole="button"
              accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <View
                style={[
                  styles.shortsRecordInner,
                  isRecording && styles.shortsRecordInnerActive,
                ]}
              />
            </Pressable>

            <View style={styles.shortsFlipButtonRemove} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_HEIGHT = Math.min(SCREEN_WIDTH * (16 / 9), 400);

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
    width: '100%',
    height: PREVIEW_HEIGHT,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: '#000000',
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
  permissionActions: { alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.md },
  permissionButton: { alignSelf: 'stretch' },
  recordedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  recordedOverlayText: { ...typography.title, color: '#FFFFFF' },
  recordedOverlayHint: { ...typography.caption, color: 'rgba(255,255,255,0.85)' },
  controls: { flexDirection: 'row', gap: spacing.sm },
  flipButton: { flex: 1 },
  recordButton: { flex: 1.4 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: { flex: 1, ...typography.caption, color: colors.textMuted },
  recordingBadge: {
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
  shortsRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  shortsTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  shortsCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortsClosePlaceholder: { width: 40, height: 40 },
  shortsCloseText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  shortsHint: { ...typography.caption, color: 'rgba(255,255,255,0.9)' },
  shortsBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    zIndex: 2,
  },
  shortsFlipButton: {
    width: 64,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.scrim,
  },
  shortsFlipButtonRemove: {
    width: 64,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.whiteAlpha[50],
  },
  shortsFlipText: { ...typography.label, color: '#FFFFFF' },
  shortsControlDisabled: { opacity: 0.4 },
  shortsRecordOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortsRecordInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.danger,
  },
  shortsRecordInnerActive: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
});

export default PostAdScreen;
