import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Home,
  MessageCircle,
  Plus,
  Shield,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { ChatInboxScreen } from '../screens/ChatInboxScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { HomeMarketplaceScreen } from '../screens/HomeMarketplaceScreen';
import { ProfileTabScreen } from '../screens/ProfileTabScreen';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

type TabKey = 'home' | 'favorites' | 'messages' | 'admin' | 'profile';

export function MainShell() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isAdmin, ready: adminReady } = useIsAdmin();
  const [tab, setTab] = useState<TabKey>('home');

  useEffect(() => {
    if (adminReady && !isAdmin && tab === 'admin') {
      setTab('home');
    }
  }, [adminReady, isAdmin, tab]);

  const goPublish = () => navigation.navigate('PostAd');

  return (
    <View style={styles.flex}>
      {tab === 'home' && <HomeMarketplaceScreen />}
      {tab === 'favorites' && <FavoritesScreen />}
      {tab === 'messages' && <ChatInboxScreen />}
      {tab === 'admin' && adminReady && isAdmin && (
        <AdminDashboardScreen navigation={navigation} />
      )}
      {tab === 'profile' && <ProfileTabScreen />}

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
        {adminReady && isAdmin && (
          <TabItem
            label={t('tabs.admin')}
            Icon={Shield}
            active={tab === 'admin'}
            onPress={() => setTab('admin')}
          />
        )}
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
