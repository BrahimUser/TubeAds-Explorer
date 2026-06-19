import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Home,
  MessageCircle,
  Plus,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../theme';
import type { MainTabKey, RootStackParamList } from './types';

const HomeMarketplaceScreen = lazy(() =>
  import('../screens/HomeMarketplaceScreen').then((m) => ({
    default: m.HomeMarketplaceScreen,
  })),
);
const FavoritesScreen = lazy(() =>
  import('../screens/FavoritesScreen').then((m) => ({ default: m.FavoritesScreen })),
);
const ChatInboxScreen = lazy(() =>
  import('../screens/ChatInboxScreen').then((m) => ({ default: m.ChatInboxScreen })),
);
const ProfileTabScreen = lazy(() =>
  import('../screens/ProfileTabScreen').then((m) => ({ default: m.ProfileTabScreen })),
);

type TabKey = MainTabKey;

function TabLoader() {
  return (
    <View style={styles.tabLoader}>
      <ActivityIndicator color={colors.marketplaceOrange} size="large" />
    </View>
  );
}

function TabPanel({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.flex, !visible && styles.tabHidden]} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </View>
  );
}

export function MainShell() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Main'>>();
  const [tab, setTab] = useState<TabKey>('home');
  const [visited, setVisited] = useState<Set<TabKey>>(() => new Set(['home']));

  useEffect(() => {
    const nextTab = route.params?.tab;
    if (!nextTab) return;
    setTab(nextTab);
    setVisited((prev) => {
      if (prev.has(nextTab)) return prev;
      const next = new Set(prev);
      next.add(nextTab);
      return next;
    });
  }, [route.params?.tab]);

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [tab]);

  const goPublish = () => navigation.navigate('PostAd');

  return (
    <View style={styles.flex}>
      {visited.has('home') ? (
        <TabPanel visible={tab === 'home'}>
          <Suspense fallback={<TabLoader />}>
            <HomeMarketplaceScreen isFocused={tab === 'home'} />
          </Suspense>
        </TabPanel>
      ) : null}
      {visited.has('favorites') ? (
        <TabPanel visible={tab === 'favorites'}>
          <Suspense fallback={<TabLoader />}>
            <FavoritesScreen isFocused={tab === 'favorites'} />
          </Suspense>
        </TabPanel>
      ) : null}
      {visited.has('messages') ? (
        <TabPanel visible={tab === 'messages'}>
          <Suspense fallback={<TabLoader />}>
            <ChatInboxScreen isFocused={tab === 'messages'} />
          </Suspense>
        </TabPanel>
      ) : null}
      {visited.has('profile') ? (
        <TabPanel visible={tab === 'profile'}>
          <Suspense fallback={<TabLoader />}>
            <ProfileTabScreen />
          </Suspense>
        </TabPanel>
      ) : null}

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TabItem
          label={t('tabs.home')}
          Icon={Home}
          active={tab === 'home'}
          onPress={() => setTab('home')}
        />
        <TabItem
          label={t('tabs.favorites')}
          Icon={Heart}
          active={tab === 'favorites'}
          onPress={() => setTab('favorites')}
        />
        <View style={styles.fabSlot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('tabs.publish')}
            onPress={goPublish}
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.92 }]}
          >
            <Plus size={30} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
        <TabItem
          label={t('tabs.messages')}
          Icon={MessageCircle}
          active={tab === 'messages'}
          onPress={() => setTab('messages')}
        />
        <TabItem
          label={t('tabs.profile')}
          Icon={User}
          active={tab === 'profile'}
          onPress={() => setTab('profile')}
        />
      </View>
    </View>
  );
}

function TabItem({
  label,
  Icon,
  active,
  onPress,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onPress: () => void;
}) {
  const c = active ? colors.marketplaceOrange : colors.tabMuted;
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="button">
      <Icon size={22} color={c} strokeWidth={active ? 2.25 : 1.75} />
      <Text style={[styles.tabLabel, { color: c }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  tabHidden: {
    display: 'none',
  },
  tabLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 8,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, minWidth: 0 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  fabSlot: { width: 72, alignItems: 'center', marginTop: -28 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.marketplaceOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.marketplaceOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: colors.surfaceElevated,
  },
});
