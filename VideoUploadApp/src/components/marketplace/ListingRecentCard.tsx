import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Clock, Heart, MapPin, Play, Tag } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ErrorBoundary } from '../ErrorBoundary';
import { categoryLabel, cityLabel } from '../../config/marketplace';
import {
  createYoutubeCardNavigationHandler,
  INLINE_YOUTUBE_PARAMS_LOOP,
  YOUTUBE_CARD_WEBVIEW_PROPS,
} from './youtubeCardShared';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import type { Ad } from '../../types/Ad';
import { formatPriceMad } from '../../utils/formatPrice';

const isWebViewAvailable: boolean =
  typeof WebView === 'function' || (typeof WebView === 'object' && WebView !== null);

const EmptyFallback = () => <View />;

type Props = {
  ad: Ad;
  width: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showNewBadge?: boolean;
  relativeTimeLabel: string;
  onOpenDetail?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  style?: ViewStyle;
};

function ListingRecentCardComponent({
  ad,
  width,
  isPlaying,
  onTogglePlay,
  showNewBadge,
  relativeTimeLabel,
  onOpenDetail,
  isFavorite = false,
  onToggleFavorite,
  style,
}: Props) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const thumbH = width / (16 / 9);
  const onWebNav = useMemo(() => createYoutubeCardNavigationHandler(), []);
  const onReady = useCallback(() => setReady(true), []);
  const thumbnailSource = useMemo(() => ({ uri: ad.thumbnailUrl }), [ad.thumbnailUrl]);
  const webViewProps = useMemo(
    () => ({
      ...YOUTUBE_CARD_WEBVIEW_PROPS,
      onShouldStartLoadWithRequest: onWebNav,
    }),
    [onWebNav],
  );

  const category = categoryLabel(ad.category);
  const descriptionPreview = ad.description.trim();
  const price = formatPriceMad(ad.priceCents, ad.currency);

  return (
    <View style={[styles.card, { width }, style]}>
      <Pressable onPress={onTogglePlay} style={[styles.thumbWrap, { height: thumbH }]}>
        <Image source={thumbnailSource} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {isWebViewAvailable && isPlaying ? (
          <View style={styles.playerLayer}>
            <ErrorBoundary resetKey={ad.youtubeVideoId} fallback={EmptyFallback}>
              <YoutubePlayer
                key={ad.id + ad.youtubeVideoId}
                height={thumbH}
                width={width}
                videoId={ad.youtubeVideoId}
                play
                onReady={onReady}
                initialPlayerParams={INLINE_YOUTUBE_PARAMS_LOOP}
                webViewStyle={styles.webView}
                webViewProps={webViewProps}
              />
            </ErrorBoundary>
          </View>
        ) : null}

        {isPlaying && isWebViewAvailable && !ready ? (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}

        {!isPlaying ? (
          <View style={styles.playOverlay} pointerEvents="none">
            <View style={styles.playBtn}>
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            </View>
          </View>
        ) : null}

        {showNewBadge ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{t('newBadge')}</Text>
          </View>
        ) : null}

        <View style={styles.categoryChip} pointerEvents="none">
          <Tag size={11} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.categoryChipText} numberOfLines={1}>
            {category}
          </Text>
        </View>

        <View style={styles.priceChip} pointerEvents="none">
          <Text style={styles.priceChipText}>{price}</Text>
        </View>

        <Pressable
          hitSlop={12}
          style={styles.heartBtn}
          onPress={onToggleFavorite}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ selected: isFavorite }}
        >
          <Heart
            size={18}
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
        <Text style={styles.title} numberOfLines={2}>
          {ad.title}
        </Text>

        {descriptionPreview ? (
          <Text style={styles.description} numberOfLines={2}>
            {descriptionPreview}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <MapPin size={12} color={colors.textDim} strokeWidth={2} />
          <Text style={styles.metaText} numberOfLines={1}>
            {cityLabel(ad.city)}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.timeRow}>
            {relativeTimeLabel ? (
              <>
                <Clock size={11} color={colors.textDim} strokeWidth={2} />
                <Text style={styles.timeText}>{relativeTimeLabel}</Text>
              </>
            ) : null}
          </View>
          <Text style={styles.price}>{price}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function recentCardPropsEqual(prev: Props, next: Props): boolean {
  return (
    prev.ad.id === next.ad.id &&
    prev.ad.title === next.ad.title &&
    prev.ad.description === next.ad.description &&
    prev.ad.priceCents === next.ad.priceCents &&
    prev.ad.thumbnailUrl === next.ad.thumbnailUrl &&
    prev.ad.youtubeVideoId === next.ad.youtubeVideoId &&
    prev.ad.currency === next.ad.currency &&
    prev.ad.city === next.ad.city &&
    prev.ad.category === next.ad.category &&
    prev.width === next.width &&
    prev.isPlaying === next.isPlaying &&
    prev.isFavorite === next.isFavorite &&
    prev.showNewBadge === next.showNewBadge &&
    prev.relativeTimeLabel === next.relativeTimeLabel &&
    prev.onTogglePlay === next.onTogglePlay &&
    prev.onOpenDetail === next.onOpenDetail &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
}

export const ListingRecentCard = React.memo(ListingRecentCardComponent, recentCardPropsEqual);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  thumbWrap: {
    width: '100%',
    backgroundColor: '#0a0a0a',
  },
  playerLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000',
  },
  webView: { backgroundColor: '#000', opacity: 0.999 },
  spinner: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingStart: 2,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    start: spacing.sm,
    backgroundColor: colors.marketplaceOrange,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  newBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categoryChip: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm + 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '46%',
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  categoryChipText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  priceChip: {
    position: 'absolute',
    bottom: spacing.sm,
    start: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heartBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    end: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: 6,
  },
  title: {
    ...typography.title,
    fontSize: 15,
    fontWeight: '800',
    color: colors.marketplaceTitle,
    lineHeight: 20,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
    flex: 1,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '600',
  },
  price: {
    ...typography.title,
    fontSize: 16,
    fontWeight: '800',
    color: colors.marketplaceOrange,
  },
});
