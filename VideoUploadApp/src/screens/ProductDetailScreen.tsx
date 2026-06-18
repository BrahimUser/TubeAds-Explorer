import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Heart,
  MapPin,
  Share2,
  Star,
} from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { categoryLabel, cityLabel } from '../config/marketplace';
import type { RootStackParamList } from '../navigation/types';
import { getAd } from '../services/listings';
import { toggleFavorite } from '../services/favorites';
import { useAuthUser } from '../hooks/useAuthUser';
import { useFavoriteIds } from '../hooks/useFavoriteIds';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad } from '../types/Ad';
import { formatPriceMad } from '../utils/formatPrice';
import { formatRelativeTimeEn } from '../utils/formatRelativeTimeEn';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = StackScreenProps<RootStackParamList, 'ProductDetail'>;

import { apiDateToMs } from '../utils/apiMappers';

function adCreatedMs(ad: Ad): number | null {
  return apiDateToMs(ad.createdAt);
}

function secondaryTagFromTitle(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 2).join(' ').slice(0, 24);
  return 'Premium';
}

export function ProductDetailScreen({ navigation, route }: Props) {
  const { adId, ad: adSnapshot } = route.params;
  const insets = useSafeAreaInsets();
  const [ad, setAd] = useState<Ad | null>(adSnapshot ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  const { user } = useAuthUser();
  const { ids: favoriteIds } = useFavoriteIds(user?.uid ?? null);
  const favorited = favoriteIds.has(adId);

  const onToggleFavorite = () => {
    if (!user) {
      navigation.navigate('Auth', { mode: 'sign-in' });
      return;
    }
    if (!ad) return;
    void toggleFavorite(ad, favorited).catch(() => {
      // Listener reconciles; no UI rollback required.
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = useCallback(() => {
    let alive = true;
    setLoadError(null);
    if (adSnapshot) {
      setAd(adSnapshot);
      return () => {
        alive = false;
      };
    }
    setAd(null);
    void (async () => {
      try {
        const doc = await getAd(adId);
        if (!alive) return;
        if (!doc) setLoadError('Listing not found.');
        else setAd(doc);
      } catch (e) {
        if (!alive) return;
        setLoadError(String((e as Error)?.message ?? e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [adId, adSnapshot]);

  React.useEffect(() => load(), [load]);

  const onShare = async () => {
    if (!ad) return;
    try {
      await Share.share({
        message: `${ad.title}\n${formatPriceMad(ad.priceCents, ad.currency)}`,
        title: ad.title,
      });
    } catch {
      /* ignore */
    }
  };

  if (!loadError && !ad) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} size="large" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        <Text style={styles.errTitle}>{loadError}</Text>
        <Pressable style={styles.retry} onPress={() => load()}>
          <Text style={styles.retryTxt}>Try again</Text>
        </Pressable>
        <Pressable style={styles.retry} onPress={() => navigation.goBack()}>
          <Text style={styles.retryTxt}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!ad) {
    return null;
  }

  const createdMs = adCreatedMs(ad);
  const timeLabel = createdMs != null ? formatRelativeTimeEn(createdMs) : '';

  const desc = ad.description?.trim() ?? '';
  const descLong = desc.length > 160;
  const descShown = descExpanded || !descLong ? desc : `${desc.slice(0, 160)}…`;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View style={styles.hero}>
          <Image source={{ uri: ad.thumbnailUrl }} style={styles.heroImg} resizeMode="cover" />
          <View style={[styles.heroBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable
              style={[styles.iconCircle, shadow.card]}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={colors.marketplaceTitle} strokeWidth={2} />
            </Pressable>
            <View style={styles.heroRight}>
              <Pressable
                style={[styles.iconCircle, shadow.card]}
                onPress={onShare}
                accessibilityLabel="Share"
              >
                <Share2 size={20} color={colors.marketplaceTitle} strokeWidth={2} />
              </Pressable>
              <Pressable
                style={[styles.iconCircle, shadow.card]}
                onPress={onToggleFavorite}
                accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
                accessibilityState={{ selected: favorited }}
              >
                <Heart
                  size={20}
                  color={colors.marketplaceOrange}
                  fill={favorited ? colors.marketplaceOrange : 'transparent'}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.pad}>
          <Text style={styles.price}>{formatPriceMad(ad.priceCents, ad.currency)}</Text>
          <Text style={styles.title}>{ad.title}</Text>
          <View style={styles.metaRow}>
            <MapPin size={16} color={colors.textMuted} strokeWidth={1.75} />
            <Text style={styles.meta}>
              {cityLabel(ad.city)}
              {timeLabel ? ` · ${timeLabel}` : ''}
            </Text>
          </View>

          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{categoryLabel(ad.category)}</Text>
            </View>
            <View style={[styles.tag, styles.tagOutline]}>
              <Text style={[styles.tagText, styles.tagOutlineText]}>
                {secondaryTagFromTitle(ad.title)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.desc}>{descShown}</Text>
          {descLong ? (
            <Pressable
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setDescExpanded((e) => !e);
              }}
            >
              <Text style={styles.voirPlus}>{descExpanded ? 'See less' : 'See more'}</Text>
            </Pressable>
          ) : null}

          <Text style={styles.sectionLabel}>Seller Information</Text>
          <View style={[styles.sellerCard, shadow.card]}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarTxt}>
                {(ad.ownerUid || '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerBody}>
              <View style={styles.sellerTop}>
                <Text style={styles.sellerName}>Verified seller</Text>
                <View style={styles.verified}>
                  <BadgeCheck size={16} color={colors.marketplaceOrange} strokeWidth={2} />
                  <Text style={styles.verifiedTxt}>Verified</Text>
                </View>
              </View>
              <View style={styles.ratingRow}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
                <Text style={styles.ratingTxt}>4.9</Text>
                <Text style={styles.ratingCount}>(128 reviews)</Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textDim} strokeWidth={2} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.9 }]}
          onPress={() =>
            navigation.navigate('Chat', { adId: ad.id, sellerUid: ad.ownerUid, ad })
          }
        >
          <Text style={styles.btnOutlineTxt}>Contact Seller</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnOrange, pressed && { opacity: 0.92 }]}
          onPress={() => navigation.navigate('Checkout', { adId: ad.id, ad })}
        >
          <Text style={styles.btnOrangeTxt}>Order Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  hero: { width: '100%', height: 280, backgroundColor: '#111' },
  heroImg: { width: '100%', height: '100%' },
  heroBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  heroRight: { flexDirection: 'row', gap: spacing.sm },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.marketplaceOrange,
    letterSpacing: -0.5,
  },
  title: { ...typography.productTitle, color: colors.marketplaceTitle },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { ...typography.caption, color: colors.textMuted, flex: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 102, 0, 0.12)',
  },
  tagText: { ...typography.caption, color: colors.marketplaceOrange, fontWeight: '700' },
  tagOutline: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagOutlineText: { color: colors.textMuted },
  sectionLabel: {
    ...typography.title,
    marginTop: spacing.lg,
    fontSize: 16,
    color: colors.marketplaceTitle,
  },
  desc: { ...typography.description, color: colors.text, marginTop: spacing.xs },
  voirPlus: {
    ...typography.label,
    color: colors.marketplaceOrange,
    marginTop: spacing.xs,
    fontWeight: '700',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    gap: spacing.md,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarTxt: { fontSize: 18, fontWeight: '800', color: colors.textMuted },
  sellerBody: { flex: 1, gap: 4 },
  sellerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  sellerName: { ...typography.title, fontSize: 15, color: colors.marketplaceTitle },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedTxt: {
    ...typography.caption,
    color: colors.marketplaceOrange,
    fontWeight: '700',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingTxt: { ...typography.caption, fontWeight: '700', color: colors.text },
  ratingCount: { ...typography.caption, color: colors.textDim },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
    elevation: 8,
  },
  btnOutline: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.marketplaceOrange,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  btnOutlineTxt: {
    ...typography.title,
    fontSize: 14,
    color: colors.marketplaceOrange,
  },
  btnOrange: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    backgroundColor: colors.marketplaceOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.marketplaceOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnOrangeTxt: { ...typography.title, fontSize: 14, color: '#FFFFFF' },
  errTitle: { ...typography.body, color: colors.danger, textAlign: 'center' },
  retry: { marginTop: spacing.md, padding: spacing.sm },
  retryTxt: { color: colors.marketplaceOrange, fontWeight: '700' },
});

export default ProductDetailScreen;
