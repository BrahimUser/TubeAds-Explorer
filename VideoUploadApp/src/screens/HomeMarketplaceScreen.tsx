import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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

function adCreatedMs(ad: Ad): number | null {
  return apiDateToMs(ad.createdAt);
}

function isNewAd(ad: Ad): boolean {
  const ms = adCreatedMs(ad);
  if (ms == null) return false;
  return Date.now() - ms < 3 * 24 * 60 * 60 * 1000;
}

export function HomeMarketplaceScreen() {
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
  const { ids: favoriteIds } = useFavoriteIds(user?.uid ?? null);

  const onToggleFavorite = (ad: Ad) => {
    if (!user) {
      navigation.navigate('Auth', { mode: 'sign-in' });
      return;
    }
    void toggleFavorite(ad, favoriteIds.has(ad.id)).catch(() => {
      // Listener will reconcile; no UI rollback needed for this opt-in
      // action.
    });
  };

  const { ads, loading, error } = useAds({ category });

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const load = async () => {
      const [list, count] = await Promise.all([
        fetchRecentNotifications(),
        fetchUnreadNotificationsCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    };
    void load();
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
  }, [user?.uid]);

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

  const gridRows = useMemo(() => {
    const rows: Ad[][] = [];
    for (let i = 0; i < recommendedAds.length; i += 2) {
      rows.push(recommendedAds.slice(i, i + 2));
    }
    return rows;
  }, [recommendedAds]);

  const togglePlay = (id: string) => {
    setPlayingId((p) => (p === id ? null : id));
  };

  const publish = () => navigation.navigate('PostAd');

  const onPressBell = () => {
    void (async () => {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setNotificationsOpen(true);
    })();
  };

  const onClearNotifications = () => {
    setNotifications([]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
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
            onPress={() => setLanguageOpen(true)}
            style={styles.langBtn}
            accessibilityLabel={t('language.accessibilityPicker')}
            accessibilityRole="button"
          >
            <Languages size={22} color={colors.marketplaceTitle} strokeWidth={1.75} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth', { mode: 'sign-in' })}
            style={styles.avatar}
            accessibilityLabel={t('home.profile')}
          >
            <UserRound size={22} color={colors.marketplaceTitle} strokeWidth={1.75} />
          </TouchableOpacity>
        </View>
      </View>

      <LanguagePickerModal visible={languageOpen} onClose={() => setLanguageOpen(false)} />

      <NotificationsModal
        visible={notificationsOpen}
        items={notifications}
        onClose={() => setNotificationsOpen(false)}
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
          onDismiss={() => setPromoVisible(false)}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              nestedScrollEnabled
            >
              {recentAds.length === 0 ? (
                <Text style={styles.empty}>{t('home.emptyListings')}</Text>
              ) : (
                recentAds.map((item) => (
                  <View key={item.id} style={{ marginEnd: GRID_GAP }}>
                    <ListingVideoCard
                      ad={item}
                      width={RECENT_CARD_W}
                      isPlaying={playingId === item.id}
                      onTogglePlay={() => togglePlay(item.id)}
                      showNewBadge={isNewAd(item)}
                      relativeTimeLabel={formatRelativeTimeEn(adCreatedMs(item))}
                      onOpenDetail={() => navigation.navigate('ProductDetail', { adId: item.id })}
                      isFavorite={favoriteIds.has(item.id)}
                      onToggleFavorite={() => onToggleFavorite(item)}
                    />
                  </View>
                ))
              )}
            </ScrollView>

            <PopularCategoriesSection onSelectCategory={(id) => setCategory(id)} />

            {gridRows.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>{t('sections.recommended')}</Text>
                {gridRows.map((pair, ri) => (
                  <View key={ri} style={styles.gridRow}>
                    {pair.map((ad) => (
                      <View key={ad.id} style={{ width: GRID_CARD_W }}>
                        <ListingVideoCard
                          ad={ad}
                          width={GRID_CARD_W}
                          isPlaying={playingId === ad.id}
                          onTogglePlay={() => togglePlay(ad.id)}
                          showNewBadge={isNewAd(ad)}
                          relativeTimeLabel={formatRelativeTimeEn(adCreatedMs(ad))}
                          onOpenDetail={() => navigation.navigate('ProductDetail', { adId: ad.id })}
                          isFavorite={favoriteIds.has(ad.id)}
                          onToggleFavorite={() => onToggleFavorite(ad)}
                        />
                      </View>
                    ))}
                    {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
        <View style={{ height: spacing.xxl + 8 }} />
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
  },
  scrollContent: { paddingTop: spacing.sm },
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
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    paddingHorizontal: H_PAD,
    marginBottom: spacing.md,
  },
  loader: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
  indexHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
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
