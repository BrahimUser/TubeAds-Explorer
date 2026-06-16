import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import { listenBuyerOrders, orderMatchesBuyerTab } from '../services/orders';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Order, OrderStatus } from '../types/Commerce';
import { formatPriceMad } from '../utils/formatPrice';
import type { Currency } from '../types/Ad';

type Tab = 'ongoing' | 'completed' | 'cancelled';

import { apiDateToMs } from '../utils/apiMappers';

function orderDateShort(order: Order): string {
  const ms = apiDateToMs(order.createdAt);
  if (ms == null) return '';
  try {
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function statusTint(status: OrderStatus) {
  switch (status) {
    case 'Pending':
      return { bg: '#FEF3C7', fg: '#B45309' };
    case 'In Progress':
      return { bg: '#E0F2FE', fg: '#0369A1' };
    case 'Completed':
      return { bg: '#DCFCE7', fg: '#15803D' };
    case 'Cancelled':
      return { bg: '#FEE2E2', fg: '#B91C1C' };
    default:
      return { bg: colors.border, fg: colors.textMuted };
  }
}

export function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('ongoing');

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', { mode: 'sign-in' });
      return;
    }
    const unsub = listenBuyerOrders(
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      (e) => {
        Alert.alert('My Orders', e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user, navigation]);

  const filtered = useMemo(
    () => orders.filter((o) => orderMatchesBuyerTab(o, tab)),
    [orders, tab],
  );

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.tabs}>
        {(
          [
            ['ongoing', 'Ongoing'] as const,
            ['completed', 'Completed'] as const,
            ['cancelled', 'Cancelled'] as const,
          ] as const
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabTxt, tab === key && styles.tabTxtActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.marketplaceOrange} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No orders in this category.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.rowCard, shadow.card]}
              onPress={() => navigation.navigate('ProductDetail', { adId: item.adId })}
            >
              <Image source={{ uri: item.adThumbnailUrl }} style={styles.thumb} resizeMode="cover" />
              <View style={styles.rowMid}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.adTitle}
                </Text>
                <Text style={styles.rowSub}>
                  {item.orderNumber}
                  {orderDateShort(item) ? ` · ${orderDateShort(item)}` : ''}
                </Text>
                <View style={[styles.pill, { backgroundColor: statusTint(item.status).bg }]}>
                  <Text style={[styles.pillTxt, { color: statusTint(item.status).fg }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View style={styles.rowEnd}>
                <Text style={styles.rowPrice}>
                  {formatPriceMad(item.totalCents, item.currency as Currency)}
                </Text>
                <ChevronRight size={20} color={colors.textDim} />
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: colors.marketplaceOrange,
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
  },
  tabTxt: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabTxtActive: { color: colors.marketplaceOrange, fontWeight: '800' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.border },
  rowMid: { flex: 1, gap: 4 },
  rowTitle: { ...typography.title, fontSize: 14, color: colors.marketplaceTitle },
  rowSub: { ...typography.caption, color: colors.textMuted },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillTxt: { ...typography.caption, fontSize: 10, fontWeight: '700' },
  rowEnd: { alignItems: 'flex-end', gap: 4 },
  rowPrice: { ...typography.title, fontSize: 14, color: colors.marketplaceOrange },
});

export default OrdersScreen;
