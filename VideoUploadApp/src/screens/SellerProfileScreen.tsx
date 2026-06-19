import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ArrowLeft, BadgeCheck, Store } from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListingVideoCard } from '../components/marketplace/ListingVideoCard';
import { useAuthUser } from '../hooks/useAuthUser';
import { useFavoriteIds } from '../hooks/useFavoriteIds';
import { useSellerProfile } from '../hooks/useSellerProfile';
import type { RootStackParamList } from '../navigation/types';
import { fetchListings } from '../services/listings';
import { toggleFavorite } from '../services/favorites';
import { sellerDisplayName } from '../services/users';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad } from '../types/Ad';
import { apiDateToMs } from '../utils/apiMappers';
import { formatRelativeTimeEn } from '../utils/formatRelativeTimeEn';

type Props = StackScreenProps<RootStackParamList, 'SellerProfile'>;

const W = Dimensions.get('window').width;
const H_PAD = spacing.lg;
const GRID_GAP = 12;
const CARD_W = (W - H_PAD * 2 - GRID_GAP) / 2;

function adCreatedMs(ad: Ad): number | null {
  return apiDateToMs(ad.createdAt);
}

function isVisibleListing(ad: Ad, isOwnShop: boolean): boolean {
  const status = String(ad.status ?? '').toLowerCase();
  if (isOwnShop) return status === 'approved' || status === 'pending';
  return status === 'approved';
}

export function SellerProfileScreen({ navigation, route }: Props) {
  const { sellerId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthUser();
  const { seller, loading: sellerLoading, error: sellerError, reload } = useSellerProfile(sellerId);
  const { ids: favoriteIds } = useFavoriteIds(user?.uid ?? null);

  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const isOwnShop = !!user?.uid && user.uid === sellerId;
  const displayName = sellerDisplayName(seller, sellerId);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadAds = useCallback(() => {
    let alive = true;
    setAdsLoading(true);
    setAdsError(null);
    void (async () => {
      try {
        const items = await fetchListings({ ownerId: sellerId, limit: 80 });
        if (!alive) return;
        setAds(items.filter((ad) => isVisibleListing(ad, isOwnShop)));
      } catch (e) {
        if (!alive) return;
        setAdsError(String((e as Error)?.message ?? e));
        setAds([]);
      } finally {
        if (alive) setAdsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sellerId, isOwnShop]);

  React.useEffect(() => loadAds(), [loadAds]);

  const onToggleFavorite = useCallback(
    (ad: Ad) => {
      if (!user) {
        navigation.navigate('Auth', { mode: 'sign-in' });
        return;
      }
      void toggleFavorite(ad, favoriteIds.has(ad.id)).catch(() => {});
    },
    [user, navigation, favoriteIds],
  );

  const header = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            style={[styles.backBtn, shadow.card]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={22} color={colors.marketplaceTitle} strokeWidth={2} />
          </Pressable>

          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, shadow.card]}>
              {seller?.shopLogoUrl ? (
                <Image source={{ uri: seller.shopLogoUrl }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>{(displayName[0] || '?').toUpperCase()}</Text>
                </View>
              )}
            </View>
            {seller?.isPro ? (
              <View style={styles.proBadge}>
                <BadgeCheck size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.proBadgeTxt}>Pro</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.shopName}>{displayName}</Text>
          <View style={styles.metaChipRow}>
            <View style={styles.metaChip}>
              <Store size={14} color={colors.secondary} strokeWidth={2} />
              <Text style={styles.metaChipTxt}>Marketplace seller</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipTxt}>{ads.length} listing{ads.length === 1 ? '' : 's'}</Text>
            </View>
          </View>

          {seller?.shopDescription ? (
            <Text style={styles.description}>{seller.shopDescription}</Text>
          ) : (
            <Text style={styles.descriptionMuted}>
              Browse this seller&apos;s listings. Quality listings, transparent prices.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Seller listings</Text>

        {sellerError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTxt}>{sellerError}</Text>
            <Pressable onPress={() => reload()}>
              <Text style={styles.retryLink}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {adsError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTxt}>{adsError}</Text>
            <Pressable onPress={() => loadAds()}>
              <Text style={styles.retryLink}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {(sellerLoading || adsLoading) && ads.length === 0 ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.marketplaceOrange} />
          </View>
        ) : null}

        {!adsLoading && ads.length === 0 && !adsError ? (
          <View style={[styles.emptyBox, shadow.card]}>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyBody}>This seller hasn&apos;t published any listings.</Text>
          </View>
        ) : null}
      </View>
    ),
    [
      insets.top,
      navigation,
      seller,
      displayName,
      ads.length,
      sellerError,
      adsError,
      sellerLoading,
      adsLoading,
      reload,
      loadAds,
    ],
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={header}
        columnWrapperStyle={ads.length > 0 ? styles.gridRow : undefined}
        contentContainerStyle={{
          paddingHorizontal: H_PAD,
          paddingBottom: Math.max(insets.bottom, spacing.xl),
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const createdMs = adCreatedMs(item);
          return (
            <View style={{ width: CARD_W, marginRight: index % 2 === 0 ? GRID_GAP : 0 }}>
              <ListingVideoCard
                ad={item}
                width={CARD_W}
                isPlaying={playingId === item.id}
                onTogglePlay={() => setPlayingId((id) => (id === item.id ? null : item.id))}
                relativeTimeLabel={createdMs != null ? formatRelativeTimeEn(createdMs) : ''}
                onOpenDetail={() => navigation.navigate('ProductDetail', { adId: item.id, ad: item })}
                isFavorite={favoriteIds.has(item.id)}
                onToggleFavorite={() => onToggleFavorite(item)}
              />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerBlock: { marginHorizontal: -H_PAD },
  hero: {
    backgroundColor: colors.surfaceElevated,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadow.card,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  avatarWrap: { alignSelf: 'center', marginTop: spacing.lg, position: 'relative' },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E4E4E7',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 34, fontWeight: '900', color: colors.textMuted },
  proBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.marketplaceTitle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  proBadgeTxt: { ...typography.caption, color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  shopName: {
    ...typography.display,
    fontSize: 24,
    color: colors.marketplaceTitle,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  metaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.secondarySubtle,
  },
  metaChipTxt: { ...typography.caption, color: colors.secondary, fontWeight: '700' },
  description: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  descriptionMuted: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.marketplaceTitle,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingHorizontal: H_PAD,
  },
  gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },
  loadingRow: { paddingVertical: spacing.xl, alignItems: 'center' },
  errorBox: {
    marginHorizontal: H_PAD,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  errorTxt: { ...typography.body, color: colors.danger },
  retryLink: {
    ...typography.label,
    color: colors.marketplaceOrange,
    marginTop: spacing.sm,
    fontWeight: '700',
  },
  emptyBox: {
    marginHorizontal: H_PAD,
    padding: spacing.xl,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: { ...typography.title, color: colors.marketplaceTitle },
  emptyBody: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
});

export default SellerProfileScreen;
