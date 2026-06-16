import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Heart, MapPin } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ErrorBoundary } from '../ErrorBoundary';
import { cityLabel } from '../../config/marketplace';
import {
  createYoutubeCardNavigationHandler,
  INLINE_YOUTUBE_PARAMS,
} from './youtubeCardShared';
import { colors, radii, spacing, typography } from '../../theme';
import type { Ad } from '../../types/Ad';
import { formatPriceMad } from '../../utils/formatPrice';

const isWebViewAvailable: boolean =
  typeof WebView === 'function' || (typeof WebView === 'object' && WebView !== null);

type Props = {
  ad: Ad;
  width: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showNewBadge?: boolean;
  relativeTimeLabel: string;
  /** Opens product detail (full marketplace flow). */
  onOpenDetail?: () => void;
  /** Driven by the live favorites listener. */
  isFavorite?: boolean;
  /** Called on heart tap. Caller decides what to do (toggle, prompt sign-in). */
  onToggleFavorite?: () => void;
};

export function ListingVideoCard({
  ad,
  width,
  isPlaying,
  onTogglePlay,
  showNewBadge,
  relativeTimeLabel,
  onOpenDetail,
  isFavorite = false,
  onToggleFavorite,
}: Props) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const videoHeight = width / (16 / 9);
  const onWebNav = useMemo(() => createYoutubeCardNavigationHandler(), []);

  return (
    <View style={[styles.card, { width }]}>
      <Pressable onPress={onTogglePlay} style={[styles.mediaWrap, { height: videoHeight }]}>
        <Image
          source={{ uri: ad.thumbnailUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {isWebViewAvailable && (
          <View style={[styles.playerLayer, !isPlaying && styles.playerHidden]}>
            <ErrorBoundary resetKey={ad.youtubeVideoId} fallback={() => <View />}>
              <YoutubePlayer
                key={ad.id + ad.youtubeVideoId}
                height={videoHeight}
                width={width}
                videoId={ad.youtubeVideoId}
                play={isPlaying}
                onReady={() => setReady(true)}
                initialPlayerParams={{ ...INLINE_YOUTUBE_PARAMS, loop: true }}
                webViewStyle={styles.webView}
                webViewProps={{
                  androidLayerType: 'hardware',
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  onShouldStartLoadWithRequest: onWebNav,
                }}
              />
            </ErrorBoundary>
          </View>
        )}

        {isPlaying && isWebViewAvailable && !ready && (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}

        {showNewBadge ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{t('newBadge')}</Text>
          </View>
        ) : null}

        <Pressable
          hitSlop={12}
          style={styles.heartBtn}
          onPress={onToggleFavorite}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ selected: isFavorite }}
        >
          <Heart
            size={22}
            color="#FFFFFF"
            fill={isFavorite ? colors.marketplaceOrange : 'transparent'}
            strokeWidth={1.75}
          />
        </Pressable>
      </Pressable>

      <Pressable
        onPress={onOpenDetail}
        disabled={!onOpenDetail}
        style={({ pressed }) => [styles.body, pressed && onOpenDetail && { opacity: 0.92 }]}
      >
        <Text style={styles.price}>{formatPriceMad(ad.priceCents, ad.currency)}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>
        <View style={styles.metaRow}>
          <MapPin size={14} color={colors.textDim} strokeWidth={1.75} />
          <Text style={styles.metaText} numberOfLines={1}>
            {cityLabel(ad.city)}
            {relativeTimeLabel ? ` · ${relativeTimeLabel}` : ''}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  mediaWrap: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  playerLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  playerHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },
  webView: { backgroundColor: '#000', opacity: 0.999 },
  spinner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.marketplaceOrange,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.marketplaceOrange,
    letterSpacing: -0.2,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.textDim,
    flex: 1,
  },
});
