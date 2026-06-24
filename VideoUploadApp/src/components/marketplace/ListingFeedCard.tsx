import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Heart, MapPin, Play, Tag } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { ErrorBoundary } from '../ErrorBoundary';
import { categoryLabel, cityLabel } from '../../config/marketplace';
import {
  createYoutubeCardNavigationHandler,
  INLINE_YOUTUBE_PARAMS_LOOP,
  YOUTUBE_CARD_WEBVIEW_PROPS,
} from './youtubeCardShared';
import { colors, radii, spacing, typography } from '../../theme';
import type { Ad } from '../../types/Ad';
import { formatPriceMad } from '../../utils/formatPrice';

const H_PAD = spacing.lg;
const W = Dimensions.get('window').width;
const CARD_W = W - H_PAD * 2;
const THUMB_H = CARD_W / (16 / 9);

const isWebViewAvailable: boolean =
  typeof WebView === 'function' || (typeof WebView === 'object' && WebView !== null);

const EmptyFallback = () => <View />;

type Props = {
  ad: Ad;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showNewBadge?: boolean;
  relativeTimeLabel: string;
  onOpenDetail?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
};

function ListingFeedCardComponent({
  ad,
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

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onTogglePlay} style={styles.thumbWrap}>
        <Image source={thumbnailSource} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {isWebViewAvailable && isPlaying ? (
          <View style={styles.playerLayer}>
            <ErrorBoundary resetKey={ad.youtubeVideoId} fallback={EmptyFallback}>
              <YoutubePlayer
                key={ad.id + ad.youtubeVideoId}
                height={THUMB_H}
                width={CARD_W}
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
              <Play size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
            </View>
          </View>
        ) : null}

        {showNewBadge ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{t('newBadge')}</Text>
          </View>
        ) : null}

        <View style={styles.priceChip} pointerEvents="none">
          <Text style={styles.priceChipText}>{formatPriceMad(ad.priceCents, ad.currency)}</Text>
        </View>

        <Pressable
          hitSlop={12}
          style={styles.heartBtn}
          onPress={onToggleFavorite}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityState={{ selected: isFavorite }}
        >
          <Heart
            size={20}
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
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{category.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {ad.title}
          </Text>

          <View style={styles.metaRow}>
            <Tag size={12} color={colors.textDim} strokeWidth={2} />
            <Text style={styles.metaText} numberOfLines={1}>
              {category}
              {relativeTimeLabel ? ` · ${relativeTimeLabel}` : ''}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={12} color={colors.textDim} strokeWidth={2} />
            <Text style={styles.metaText} numberOfLines={1}>
              {cityLabel(ad.city)}
            </Text>
          </View>

          {descriptionPreview ? (
            <Text style={styles.description} numberOfLines={2}>
              {descriptionPreview}
            </Text>
          ) : null}

          <Text style={styles.priceInline}>{formatPriceMad(ad.priceCents, ad.currency)}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function feedCardPropsEqual(prev: Props, next: Props): boolean {
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
    prev.isPlaying === next.isPlaying &&
    prev.isFavorite === next.isFavorite &&
    prev.showNewBadge === next.showNewBadge &&
    prev.relativeTimeLabel === next.relativeTimeLabel &&
    prev.onTogglePlay === next.onTogglePlay &&
    prev.onOpenDetail === next.onOpenDetail &&
    prev.onToggleFavorite === next.onToggleFavorite
  );
}

export const ListingFeedCard = React.memo(ListingFeedCardComponent, feedCardPropsEqual);

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: H_PAD,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbWrap: {
    width: CARD_W,
    height: THUMB_H,
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
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingStart: 3,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heartBtn: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarLetter: {
    ...typography.title,
    fontSize: 16,
    fontWeight: '800',
    color: colors.marketplaceOrange,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.title,
    fontSize: 15,
    fontWeight: '700',
    color: colors.marketplaceTitle,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
    lineHeight: 17,
    marginTop: 2,
  },
  priceInline: {
    ...typography.title,
    fontSize: 16,
    fontWeight: '800',
    color: colors.marketplaceOrange,
    marginTop: 4,
  },
});
