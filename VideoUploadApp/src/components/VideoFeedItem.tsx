import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MapPin, ShoppingBag } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ErrorBoundary } from './ErrorBoundary';
import { categoryLabel, cityLabel } from '../config/marketplace';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad, Currency } from '../types/Ad';

const WINDOW_WIDTH = Dimensions.get('window').width;

/** Must stay in sync with `react-native-youtube-iframe` remote iframe HTML host. */
const RN_YOUTUBE_IFRAME_HTML =
  'https://lonelycpp.github.io/react-native-youtube-iframe/iframe_v2.html';

/** Listing video — 16:9, inset to align with product card padding + radius. */
const VIDEO_ASPECT = 16 / 9;
const VIDEO_CARD_INSET = spacing.lg;
const DETAILS_MIN_HEIGHT = 188;

const isWebViewAvailable: boolean =
  typeof WebView === 'function' ||
  (typeof WebView === 'object' && WebView !== null);

type Props = {
  ad: Ad;
  isActive: boolean;
  height: number;
};

function formatPrice(priceCents: number, currency: Currency): string {
  const value = priceCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}

async function openOnYouTube(videoId: string): Promise<void> {
  const appUrl = `vnd.youtube://${videoId}`;
  const webUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpenApp ? appUrl : webUrl);
  } catch {
    Alert.alert(
      'Could not open YouTube',
      'Please check your internet connection and try again.',
    );
  }
}

export function VideoFeedItem({ ad, isActive, height }: Props) {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const videoWidth = WINDOW_WIDTH - VIDEO_CARD_INSET * 2;

  const videoHeight = useMemo(() => {
    const ideal = videoWidth / VIDEO_ASPECT;
    const maxV = Math.max(height - DETAILS_MIN_HEIGHT, videoWidth * 0.42);
    return Math.min(ideal, maxV);
  }, [height, videoWidth]);

  const onWebViewShouldStart = useMemo(
    () => (request: { url: string; mainDocumentURL?: string }) => {
      const url = request.mainDocumentURL || request.url;
      if (!url) {
        return true;
      }
      if (Platform.OS === 'ios' && url === 'about:blank') {
        return true;
      }
      if (
        url.startsWith('https://www.youtube.com/') ||
        url.startsWith('https://youtube.com/') ||
        url.startsWith('https://m.youtube.com/') ||
        url.startsWith('https://youtu.be/')
      ) {
        void Linking.openURL(url).catch(() => undefined);
        return false;
      }
      return url.startsWith(RN_YOUTUBE_IFRAME_HTML) || url === 'about:blank';
    },
    [],
  );

  React.useEffect(() => {
    setPlaying(isActive);
  }, [isActive]);

  React.useEffect(() => {
    setReady(false);
  }, [ad.youtubeVideoId, isActive]);

  const onPressCommandez = () => {
    Alert.alert(
      'Commandez',
      'La messagerie vendeur arrive bientôt. En attendant, vous pouvez ouvrir la chaîne depuis le lecteur YouTube (logo ou titre) ou contacter le vendeur via son annonce.',
      [{ text: 'OK' }],
    );
  };

  return (
    <View style={[styles.page, { height, width: '100%' }]}>
      <View style={styles.videoCard}>
        <View style={styles.videoCardInner}>
          <View style={[styles.videoShell, { width: '100%', height: videoHeight }]}>
          <Image
            source={{ uri: ad.thumbnailUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />

          {isActive && (
            <View style={styles.playerWrap} pointerEvents="box-none">
              {isWebViewAvailable ? (
                <ErrorBoundary
                  resetKey={ad.youtubeVideoId}
                  fallback={(error, retry) => (
                    <PlayerFallback
                      videoId={ad.youtubeVideoId}
                      thumbnailUrl={ad.thumbnailUrl}
                      message={
                        __DEV__
                          ? `Player error: ${error.message}`
                          : 'Video player unavailable on this device.'
                      }
                      onRetry={retry}
                    />
                  )}
                >
                  {/*
                    Inline: `react-native-youtube-iframe` sets IFrame `playsinline: 1`.
                    No `playInline` prop exists in v2.x; WebView uses allowsInlineMediaPlayback.
                  */}
                  <YoutubePlayer
                    key={ad.youtubeVideoId}
                    height={videoHeight}
                    width={videoWidth}
                    videoId={ad.youtubeVideoId}
                    play={playing}
                    onReady={() => setReady(true)}
                    onChangeState={(state: string) => {
                      if (state === 'ended') {
                        setPlaying(false);
                        setTimeout(() => setPlaying(true), 50);
                      }
                    }}
                    initialPlayerParams={{
                      controls: true,
                      modestbranding: true,
                      rel: false,
                      loop: true,
                      preventFullScreen: true,
                    }}
                    viewContainerStyle={styles.youtubeViewContainer}
                    webViewStyle={styles.webView}
                    webViewProps={{
                      androidLayerType: 'hardware',
                      allowsInlineMediaPlayback: true,
                      mediaPlaybackRequiresUserAction: false,
                      onShouldStartLoadWithRequest: onWebViewShouldStart,
                    }}
                  />
                </ErrorBoundary>
              ) : (
                <PlayerFallback
                  videoId={ad.youtubeVideoId}
                  thumbnailUrl={ad.thumbnailUrl}
                  message="Video player unavailable. Rebuild the app with react-native-webview."
                />
              )}
            </View>
          )}

          {isActive && !ready && isWebViewAvailable && (
            <View style={styles.spinner} pointerEvents="none">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </View>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.metaRow}>
          {ad.city ? (
            <View style={styles.metaChip}>
              <MapPin size={14} color={colors.secondary} strokeWidth={1.75} />
              <Text style={styles.metaChipText}>{cityLabel(ad.city)}</Text>
            </View>
          ) : null}
          {ad.category ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{categoryLabel(ad.category)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>
        {ad.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {ad.description}
          </Text>
        ) : null}

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeLabel}>Prix</Text>
          <Text style={styles.priceBadgeAmount}>
            {formatPrice(ad.priceCents, ad.currency)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Commandez"
          onPress={onPressCommandez}
          style={({ pressed }) => [styles.commandez, pressed && styles.commandezPressed]}
        >
          <ShoppingBag size={22} color="#FFFFFF" strokeWidth={1.75} />
          <Text style={styles.commandezLabel}>Commandez</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PlayerFallback({
  videoId,
  thumbnailUrl,
  message,
  onRetry,
}: {
  videoId: string;
  thumbnailUrl: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={fallbackStyles.container}>
      <Image
        source={{ uri: thumbnailUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        blurRadius={6}
      />
      <View style={fallbackStyles.scrim} />
      <View style={fallbackStyles.body}>
        <Text style={fallbackStyles.title}>Vidéo indisponible ici</Text>
        <Text style={fallbackStyles.message}>{message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => openOnYouTube(videoId)}
          style={({ pressed }) => [
            fallbackStyles.primaryBtn,
            pressed && fallbackStyles.primaryBtnPressed,
          ]}
        >
          <Text style={fallbackStyles.primaryBtnText}>Voir sur YouTube</Text>
        </Pressable>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [
              fallbackStyles.secondaryBtn,
              pressed && fallbackStyles.secondaryBtnPressed,
            ]}
          >
            <Text style={fallbackStyles.secondaryBtnText}>Réessayer</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  body: {
    width: '78%',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  message: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
  },
  primaryBtnPressed: { opacity: 0.85 },
  primaryBtnText: {
    ...typography.label,
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  secondaryBtnPressed: { opacity: 0.7 },
  secondaryBtnText: {
    ...typography.label,
    color: '#FFFFFF',
    fontSize: 12,
  },
});

const styles = StyleSheet.create({
  page: {
    width: '100%',
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  videoCard: {
    marginHorizontal: VIDEO_CARD_INSET,
    marginTop: spacing.sm,
    borderRadius: radii.md,
    alignSelf: 'stretch',
    ...shadow.card,
  },
  videoCardInner: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  videoShell: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  playerWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  youtubeViewContainer: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
  webView: { backgroundColor: '#000', opacity: 0.999 },
  spinner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    alignSelf: 'stretch',
    marginHorizontal: VIDEO_CARD_INSET,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 4,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    gap: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  title: {
    ...typography.productTitle,
    color: colors.text,
  },
  description: {
    ...typography.description,
    color: colors.textMuted,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.priceTint,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.brand,
    ...shadow.priceTag,
  },
  priceBadgeLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.brand,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
    opacity: 0.9,
  },
  priceBadgeAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  commandez: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.md + 4,
    borderRadius: radii.md,
    backgroundColor: colors.brand,
    ...shadow.cta,
  },
  commandezPressed: {
    backgroundColor: colors.brandPressed,
    opacity: 0.96,
  },
  commandezLabel: {
    ...typography.title,
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default VideoFeedItem;
