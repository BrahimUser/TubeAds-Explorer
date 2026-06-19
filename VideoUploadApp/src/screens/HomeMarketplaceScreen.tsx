import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bell, Languages, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { NotificationsModal } from '../components/NotificationsModal';
import { ListingVideoCard } from '../components/marketplace/ListingVideoCard';
import { MarketplaceCategorySquares } from '../components/marketplace/MarketplaceCategorySquares';
import { MarketplaceSearchBar } from '../components/marketplace/MarketplaceSearchBar';
import { PopularCategoriesSection } from '../components/marketplace/PopularCategoriesSection';
import { PromoBanner } from '../components/marketplace/PromoBanner';
import type { CategoryId } from '../config/marketplace';
import { cityLabel } from '../config/marketplace';
import type { NotificationItem } from '../data/mockNotifications';
import { createPoller } from '../hooks/usePolling';
import {
  fetchRecentNotifications,
  fetchUnreadNotificationsCount,
  markNotificationRead,
} from '../services/notificationsApi';
import { apiDateToMs } from '../utils/apiMappers';
import { useAds } from '../hooks/useAds';
import { useAuthUser } from '../hooks/useAuthUser';
import { useFavoriteIds } from '../hooks/useFavoriteIds';
import type { RootStackParamList } from '../navigation/types';
import { toggleFavorite } from '../services/favorites';
import { colors, spacing, typography } from '../theme';
import type { Ad } from '../types/Ad';
import { formatRelativeTimeEn } from '../utils/formatRelativeTimeEn';

const LOGO = require('../../assets/images/logo.png');

const W = Dimensions.get('window').width;
const H_PAD = spacing.lg;
const GRID_GAP = 12;
const GRID_CARD_W = (W - H_PAD * 2 - GRID_GAP) / 2;
const RECENT_CARD_W = W * 0.72;

type Nav = StackNavigationProp<RootStackParamList>;

type HomeListingRowProps = {
  ad: Ad;
  width: number;
  playingId: string | null;
  isFavorite: boolean;
  onTogglePlay: (id: string) => void;
  onOpenDetail: (ad: Ad) => void;
  onToggleFavorite: (ad: Ad) => void;
  wrapStyle?: object;
};

const HomeListingRow = React.memo(function HomeListingRow({
  ad,
  width,
  playingId,
  isFavorite,
  onTogglePlay,
  onOpenDetail,
  onToggleFavorite,
  wrapStyle,
}: HomeListingRowProps) {
  const createdMs = adCreatedMs(ad);
  const handleTogglePlay = useCallback(() => onTogglePlay(ad.id), [ad.id, onTogglePlay]);
  const handleOpenDetail = useCallback(() => onOpenDetail(ad), [ad, onOpenDetail]);
  const handleToggleFavorite = useCallback(
    () => onToggleFavorite(ad),
    [ad, onToggleFavorite],
  );

  return (
    <View style={wrapStyle}>
      <ListingVideoCard
        ad={ad}
        width={width}
        isPlaying={playingId === ad.id}
        onTogglePlay={handleTogglePlay}
        showNewBadge={isNewAd(ad)}
        relativeTimeLabel={formatRelativeTimeEn(createdMs)}
        onOpenDetail={handleOpenDetail}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />
    </View>
  );
});

function adCreatedMs(ad: Ad): number | null {
  return apiDateToMs(ad.createdAt);
}

function isNewAd(ad: Ad): boolean {
  const ms = adCreatedMs(ad);
  if (ms == null) return false;
  return Date.now() - ms < 3 * 24 * 60 * 60 * 1000;
}

type Props = {
  /** When false, polling hooks pause (tab inactive in MainShell). */
  isFocused?: boolean;
};

export function HomeMarketplaceScreen({ isFocused = true }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState('');
  const [promoVisible, setPromoVisible] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user } = useAuthUser();
  const { ids: favoriteIds } = useFavoriteIds(user?.uid ?? null, { enabled: isFocused });
  const favoriteIdsRef = useRef(favoriteIds);
  favoriteIdsRef.current = favoriteIds;

  const { ads, loading, error } = useAds({ category, enabled: isFocused });

  useEffect(() => {
    if (!user || !isFocused) {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
      }
      return;
    }
    return createPoller(
      async () => {
        const [list, count] = await Promise.all([
          fetchRecentNotifications(),
          fetchUnreadNotificationsCount(),
        ]);
        return { list, count };
      },
      ({ list, count }) => {
        setNotifications(list);
        setUnreadCount(count);
      },
      undefined,
      15000,
    );
  }, [user?.uid, isFocused]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ads;
    return ads.filter((a) => {
      const city = cityLabel(a.city).toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        city.includes(q)
      );
    });
  }, [ads, query]);

  const recentAds = useMemo(() => filtered.slice(0, 12), [filtered]);
  const recommendedAds = useMemo(() => {
    if (filtered.length <= 12) return [];
    return filtered.slice(12);
  }, [filtered]);

  const rootPadding = useMemo(() => ({ paddingTop: insets.top }), [insets.top]);

  const onToggleFavorite = useCallback(
    (ad: Ad) => {
      if (!user) {
        navigation.navigate('Auth', { mode: 'sign-in' });
        return;
      }
      void toggleFavorite(ad, favoriteIdsRef.current.has(ad.id)).catch(() => {
        // Listener will reconcile; no UI rollback needed for this opt-in action.
      });
    },
    [user, navigation],
  );

  const togglePlay = useCallback((id: string) => {
    setPlayingId((p) => (p === id ? null : id));
  }, []);

  const onOpenDetail = useCallback(
    (ad: Ad) => {
      navigation.navigate('ProductDetail', { adId: ad.id, ad });
    },
    [navigation],
  );

  const publish = useCallback(() => navigation.navigate('PostAd'), [navigation]);

  const onPressBell = useCallback(() => {
    void (async () => {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setNotificationsOpen(true);
    })();
  }, [notifications]);

  const onClearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const openLanguage = useCallback(() => setLanguageOpen(true), []);
  const closeLanguage = useCallback(() => setLanguageOpen(false), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const openProfile = useCallback(() => {
    if (user) {
      navigation.navigate('Main', { tab: 'profile' });
      return;
    }
    navigation.navigate('Auth', { mode: 'sign-in' });
  }, [user, navigation]);

  const profileAvatarLetter = useMemo(() => {
    if (!user) return null;
    const label = user.shopName?.trim() || user.displayName?.trim() || 'U';
    return label.charAt(0).toUpperCase();
  }, [user]);
  const dismissPromo = useCallback(() => setPromoVisible(false), []);
  const onSelectCategory = useCallback((id: CategoryId) => setCategory(id), []);

  const renderRecentItem = useCallback(
    ({ item }: { item: Ad }) => (
      <HomeListingRow
        ad={item}
        width={RECENT_CARD_W}
        playingId={playingId}
        isFavorite={favoriteIds.has(item.id)}
        onTogglePlay={togglePlay}
        onOpenDetail={onOpenDetail}
        onToggleFavorite={onToggleFavorite}
        wrapStyle={styles.recentItemWrap}
      />
    ),
    [playingId, favoriteIds, togglePlay, onOpenDetail, onToggleFavorite],
  );

  const renderGridItem = useCallback(
    ({ item }: { item: Ad }) => (
      <HomeListingRow
        ad={item}
        width={GRID_CARD_W}
        playingId={playingId}
        isFavorite={favoriteIds.has(item.id)}
        onTogglePlay={togglePlay}
        onOpenDetail={onOpenDetail}
        onToggleFavorite={onToggleFavorite}
        wrapStyle={styles.gridItemWrap}
      />
    ),
    [playingId, favoriteIds, togglePlay, onOpenDetail, onToggleFavorite],
  );

  const recentKeyExtractor = useCallback((item: Ad) => item.id, []);
  const gridKeyExtractor = useCallback((item: Ad) => item.id, []);

  return (
    <View style={[styles.root, rootPadding]}>
      <View style={styles.topRow}>
        <View style={styles.brandWrap}>
          <Image source={LOGO} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.brandTitle}>{t('headerTitle')}</Text>
        </View>
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={onPressBell}
            style={styles.bellWrap}
            accessibilityLabel={t('home.notifications')}
            accessibilityRole="button"
          >
            <Bell size={22} color={colors.marketplaceTitle} strokeWidth={1.75} />
            {unreadCount > 0 ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openLanguage}
            style={styles.langBtn}
            accessibilityLabel={t('language.accessibilityPicker')}
            accessibilityRole="button"
          >
            <Languages size={22} color={colors.marketplaceTitle} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openProfile}
            style={styles.avatar}
            accessibilityLabel={t('home.profile')}
          >
            {user?.shopLogoUrl ? (
              <Image source={{ uri: user.shopLogoUrl }} style={styles.avatarImg} resizeMode="cover" />
            ) : user && profileAvatarLetter ? (
              <Text style={styles.avatarLetter}>{profileAvatarLetter}</Text>
            ) : (
              <UserRound size={22} color={colors.marketplaceTitle} strokeWidth={1.75} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <LanguagePickerModal visible={languageOpen} onClose={closeLanguage} />

      <NotificationsModal
        visible={notificationsOpen}
        items={notifications}
        onClose={closeNotifications}
        onClear={onClearNotifications}
      />

      <MarketplaceSearchBar value={query} onChangeText={setQuery} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
      >
        <View style={styles.catPad}>
          <MarketplaceCategorySquares value={category} onChange={setCategory} />
        </View>

        <PromoBanner
          visible={promoVisible}
          onDismiss={dismissPromo}
          onPublish={publish}
        />

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.marketplaceOrange} size="large" />
          </View>
        ) : error ? (
          <Text style={styles.err}>{error.message}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{t('sections.recent')}</Text>
            {recentAds.length === 0 ? (
              <Text style={styles.empty}>{t('home.emptyListings')}</Text>
            ) : (
              <FlatList
                horizontal
                data={recentAds}
                keyExtractor={recentKeyExtractor}
                renderItem={renderRecentItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hList}
                nestedScrollEnabled
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
                removeClippedSubviews
              />
            )}

            <PopularCategoriesSection onSelectCategory={onSelectCategory} />

            {recommendedAds.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>{t('sections.recommended')}</Text>
                <FlatList
                  data={recommendedAds}
                  keyExtractor={gridKeyExtractor}
                  renderItem={renderGridItem}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.gridRow}
                  contentContainerStyle={styles.gridList}
                  initialNumToRender={6}
                  maxToRenderPerBatch={6}
                  windowSize={5}
                  removeClippedSubviews
                />
              </>
            ) : null}
          </>
        )}
        <View style={styles.scrollFooter} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: spacing.sm + 2,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  brandLogo: {
    width: 32,
    height: 32,
  },
  brandTitle: {
    ...typography.display,
    fontSize: 24,
    fontWeight: '800',
    color: colors.marketplaceTitle,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bellWrap: { position: 'relative', padding: 4 },
  langBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.marketplaceOrange,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: {
    ...typography.title,
    fontSize: 16,
    fontWeight: '800',
    color: colors.marketplaceTitle,
  },
  scrollContent: { paddingTop: spacing.sm },
  scrollFooter: { height: spacing.xxl + 8 },
  catPad: { marginTop: spacing.sm },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: H_PAD,
    marginBottom: spacing.md,
    color: colors.marketplaceTitle,
  },
  hList: {
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.lg,
  },
  recentItemWrap: { marginEnd: GRID_GAP },
  gridList: {
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.md,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: spacing.md,
  },
  gridItemWrap: { flex: 1 },
  loader: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  err: {
    ...typography.body,
    color: colors.danger,
    marginHorizontal: H_PAD,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    paddingHorizontal: H_PAD,
    marginBottom: spacing.md,
  },
});

export default HomeMarketplaceScreen;
