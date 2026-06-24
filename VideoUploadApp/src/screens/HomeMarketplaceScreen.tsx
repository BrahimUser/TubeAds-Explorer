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
import { HomeQuickActions } from '../components/marketplace/HomeQuickActions';
import { HomeSectionHeader } from '../components/marketplace/HomeSectionHeader';
import { HomeTrustStrip } from '../components/marketplace/HomeTrustStrip';
import { ListingFeedCard } from '../components/marketplace/ListingFeedCard';
import { ListingRecentCard } from '../components/marketplace/ListingRecentCard';
import { MarketplaceCategorySquares } from '../components/marketplace/MarketplaceCategorySquares';
import { MarketplaceOverviewCard } from '../components/marketplace/MarketplaceOverviewCard';
import { MarketplaceSearchBar } from '../components/marketplace/MarketplaceSearchBar';
import { PopularCategoriesSection } from '../components/marketplace/PopularCategoriesSection';
import { PromoBanner } from '../components/marketplace/PromoBanner';
import { TopCitiesSection } from '../components/marketplace/TopCitiesSection';
import type { CategoryId, CityId } from '../config/marketplace';
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
import { colors, radii, spacing, typography } from '../theme';
import type { Ad } from '../types/Ad';
import { formatRelativeTimeEn } from '../utils/formatRelativeTimeEn';
import {
  computeCategoryCounts,
  computeHomeStats,
  computeTopCities,
} from '../utils/homeMarketplaceStats';

const LOGO = require('../../assets/images/logo.png');

const W = Dimensions.get('window').width;
const H_PAD = spacing.lg;
const GRID_GAP = 12;
const RECENT_CARD_W = W * 0.82;

type Nav = StackNavigationProp<RootStackParamList>;

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
  const [cityFilter, setCityFilter] = useState<CityId | null>(null);
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

  const scrollRef = useRef<ScrollView>(null);
  const listingsOffsetRef = useRef(0);

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
    let list = ads;
    if (cityFilter) {
      list = list.filter((a) => a.city === cityFilter);
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const city = cityLabel(a.city).toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        city.includes(q)
      );
    });
  }, [ads, query, cityFilter]);

  const homeStats = useMemo(() => computeHomeStats(ads), [ads]);
  const categoryCounts = useMemo(() => computeCategoryCounts(ads), [ads]);
  const topCities = useMemo(() => computeTopCities(ads), [ads]);

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
  const onSelectCategory = useCallback((id: CategoryId) => {
    setCategory(id);
    setCityFilter(null);
  }, []);
  const clearFilters = useCallback(() => {
    setCategory(null);
    setCityFilter(null);
    setQuery('');
    setPlayingId(null);
  }, []);

  const onListingsLayout = useCallback((y: number) => {
    listingsOffsetRef.current = y;
  }, []);

  const scrollToListings = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, listingsOffsetRef.current - spacing.sm),
      animated: true,
    });
  }, []);

  const onQuickAction = useCallback(
    (id: 'sell' | 'favorites' | 'messages' | 'browse') => {
      switch (id) {
        case 'sell':
          publish();
          break;
        case 'favorites':
          navigation.navigate('Main', { tab: 'favorites' });
          break;
        case 'messages':
          navigation.navigate('Main', { tab: 'messages' });
          break;
        case 'browse':
          clearFilters();
          requestAnimationFrame(() => scrollToListings());
          break;
      }
    },
    [publish, navigation, clearFilters, scrollToListings],
  );

  const onSelectCity = useCallback((cityId: CityId) => {
    setCityFilter(cityId);
    setQuery('');
  }, []);

  const renderRecentItem = useCallback(
    ({ item }: { item: Ad }) => {
      const createdMs = adCreatedMs(item);
      return (
        <ListingRecentCard
          ad={item}
          width={RECENT_CARD_W}
          isPlaying={playingId === item.id}
          onTogglePlay={() => togglePlay(item.id)}
          showNewBadge={isNewAd(item)}
          relativeTimeLabel={formatRelativeTimeEn(createdMs)}
          onOpenDetail={() => onOpenDetail(item)}
          isFavorite={favoriteIds.has(item.id)}
          onToggleFavorite={() => onToggleFavorite(item)}
          style={styles.recentItemWrap}
        />
      );
    },
    [playingId, favoriteIds, togglePlay, onOpenDetail, onToggleFavorite],
  );

  const renderFeedItem = useCallback(
    ({ item }: { item: Ad }) => {
      const createdMs = adCreatedMs(item);
      return (
        <ListingFeedCard
          ad={item}
          isPlaying={playingId === item.id}
          onTogglePlay={() => togglePlay(item.id)}
          showNewBadge={isNewAd(item)}
          relativeTimeLabel={formatRelativeTimeEn(createdMs)}
          onOpenDetail={() => onOpenDetail(item)}
          isFavorite={favoriteIds.has(item.id)}
          onToggleFavorite={() => onToggleFavorite(item)}
        />
      );
    },
    [playingId, favoriteIds, togglePlay, onOpenDetail, onToggleFavorite],
  );

  const recentKeyExtractor = useCallback((item: Ad) => item.id, []);

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
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
      >
        <View style={styles.catPad}>
          <MarketplaceCategorySquares
            value={category}
            onChange={(id) => {
              setCategory(id);
              setCityFilter(null);
            }}
          />
        </View>

        {!loading && !error && ads.length > 0 ? (
          <MarketplaceOverviewCard stats={homeStats} />
        ) : null}

        <HomeQuickActions onAction={onQuickAction} />

        {(category || cityFilter) && !loading ? (
          <View style={styles.filterBar}>
            <Text style={styles.filterText} numberOfLines={1}>
              {category
                ? t('home.showingCategory', { category: t(`categories.${category}`) })
                : cityFilter
                  ? t('home.showingCity', { city: cityLabel(cityFilter) })
                  : ''}
            </Text>
            <TouchableOpacity onPress={clearFilters} hitSlop={8}>
              <Text style={styles.filterClear}>{t('home.clearFilter')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <PromoBanner
          visible={promoVisible}
          onDismiss={dismissPromo}
          onPublish={publish}
        />

        <HomeTrustStrip />

        <View
          collapsable={false}
          onLayout={(e) => onListingsLayout(e.nativeEvent.layout.y)}
        >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.marketplaceOrange} size="large" />
          </View>
        ) : error ? (
          <Text style={styles.err}>{error.message}</Text>
        ) : (
          <>
            <HomeSectionHeader
              title={t('sections.recent')}
              subtitle={t('home.recentSubtitle', { count: recentAds.length })}
            />
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

            <PopularCategoriesSection
              onSelectCategory={onSelectCategory}
              categoryCounts={categoryCounts}
            />

            <TopCitiesSection cities={topCities} onSelectCity={onSelectCity} />

            {recommendedAds.length > 0 ? (
              <View style={styles.feedSection}>
                <HomeSectionHeader
                  title={t('sections.recommended')}
                  subtitle={t('home.recommendedSubtitle')}
                />
                {recommendedAds.map((ad) => (
                  <React.Fragment key={ad.id}>{renderFeedItem({ item: ad })}</React.Fragment>
                ))}
              </View>
            ) : null}
          </>
        )}
        </View>
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: H_PAD,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brandSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.2)',
    gap: spacing.sm,
  },
  filterText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.marketplaceTitle,
    flex: 1,
  },
  filterClear: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '800',
    color: colors.marketplaceOrange,
  },
  scrollContent: { paddingTop: spacing.md },
  scrollFooter: { height: spacing.xxl + 8 },
  catPad: { marginBottom: spacing.sm },
  hList: {
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.lg,
  },
  recentItemWrap: { marginEnd: GRID_GAP },
  feedSection: {
    marginTop: spacing.sm,
  },
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
