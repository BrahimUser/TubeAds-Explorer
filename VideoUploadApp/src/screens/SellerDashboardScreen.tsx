import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { LayoutGrid, Package, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import {
  listenSellerOrders,
  orderMatchesSellerChip,
  sellerAdvanceOrder,
} from '../services/orders';
import { formatApiDateLabel } from '../utils/apiMappers';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Order, OrderStatus } from '../types/Commerce';
import { formatPriceMad } from '../utils/formatPrice';
import type { Currency } from '../types/Ad';

type TopTab = 'listings' | 'stats' | 'orders';
type StatusChip = 'all' | OrderStatus;

type Props = StackScreenProps<RootStackParamList, 'SellerDashboard'>;

function orderDateLabel(order: Order): string {
  return formatApiDateLabel(order.createdAt);
}

function statusBadgeStyle(status: OrderStatus) {
  switch (status) {
    case 'Pending':
      return { bg: '#FEF3C7', color: '#B45309' };
    case 'In Progress':
      return { bg: '#E0F2FE', color: '#0369A1' };
    case 'Completed':
      return { bg: '#DCFCE7', color: '#15803D' };
    case 'Cancelled':
      return { bg: '#FEE2E2', color: '#B91C1C' };
    default:
      return { bg: colors.border, color: colors.textMuted };
  }
}

export function SellerDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthUser();
  const [topTab, setTopTab] = useState<TopTab>('orders');
  const [statusChip, setStatusChip] = useState<StatusChip>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: 'Seller' });
  }, [navigation]);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', { mode: 'sign-in' });
      return;
    }
    const unsub = listenSellerOrders(
      (list) => {
        setOrders(list);
        setLoading(false);
      },
      (e) => {
        Alert.alert('Orders', e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user, navigation]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => orderMatchesSellerChip(o, statusChip)),
    [orders, statusChip],
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
      <View style={[styles.topNav, shadow.card]}>
        {(
          [
            ['listings', 'My Listings', LayoutGrid] as const,
            ['stats', 'Statistics', TrendingUp] as const,
            ['orders', 'Orders', Package] as const,
          ] as const
        ).map(([key, label, Icon]) => (
          <Pressable
            key={key}
            style={[styles.topNavItem, topTab === key && styles.topNavItemActive]}
            onPress={() => setTopTab(key)}
          >
            <Icon
              size={18}
              color={topTab === key ? colors.marketplaceOrange : colors.textMuted}
              strokeWidth={2}
            />
            <Text
              style={[styles.topNavTxt, topTab === key && styles.topNavTxtActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {topTab === 'listings' && (
        <View style={styles.placeholder}>
          <LayoutGrid size={40} color={colors.textDim} strokeWidth={1.5} />
          <Text style={styles.placeholderTitle}>My Listings</Text>
          <Text style={styles.placeholderBody}>
            Manage your listings from the home tab. Tap the + button to post a new listing.
          </Text>
        </View>
      )}

      {topTab === 'stats' && (
        <View style={styles.placeholder}>
          <TrendingUp size={40} color={colors.textDim} strokeWidth={1.5} />
          <Text style={styles.placeholderTitle}>Statistics</Text>
          <Text style={styles.placeholderBody}>
            Sales analytics and reports will appear here in a future update.
          </Text>
        </View>
      )}

      {topTab === 'orders' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
          >
            {(
              [
                ['all', 'All'] as const,
                ['Pending', 'Pending'] as const,
                ['In Progress', 'In Progress'] as const,
                ['Completed', 'Completed'] as const,
                ['Cancelled', 'Cancelled'] as const,
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.chip, statusChip === key && styles.chipActive]}
                onPress={() => setStatusChip(key as StatusChip)}
              >
                <Text style={[styles.chipTxt, statusChip === key && styles.chipTxtActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.marketplaceOrange} size="large" />
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listPad}
              ListEmptyComponent={
                <Text style={styles.empty}>No orders match this filter.</Text>
              }
              renderItem={({ item }) => (
                <SellerOrderCard
                  order={item}
                  onViewDetails={() =>
                    navigation.navigate('SellerOrderDetail', { orderId: item.id })
                  }
                  onConfirm={async () => {
                    try {
                      await sellerAdvanceOrder(item.id, 'confirm');
                    } catch (e) {
                      Alert.alert('Unable to confirm', String((e as Error)?.message ?? e));
                    }
                  }}
                  onMarkShipped={async () => {
                    try {
                      await sellerAdvanceOrder(item.id, 'mark_shipped');
                    } catch (e) {
                      Alert.alert('Unable to update', String((e as Error)?.message ?? e));
                    }
                  }}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

function SellerOrderCard({
  order,
  onViewDetails,
  onConfirm,
  onMarkShipped,
}: {
  order: Order;
  onViewDetails: () => void;
  onConfirm: () => void;
  onMarkShipped: () => void;
}) {
  const currency = order.currency as Currency;
  const badge = statusBadgeStyle(order.status);
  const unitPrice = order.priceCents ?? order.subtotalCents;
  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{orderDateLabel(order)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeTxt, { color: badge.color }]}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Image source={{ uri: order.adThumbnailUrl }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.cardMain}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {order.adTitle}
          </Text>
          <Text style={styles.unitPrice}>{formatPriceMad(unitPrice, currency)}</Text>
          <Text style={styles.customerName} numberOfLines={1}>
            {order.delivery.fullName}
          </Text>
          <Text style={styles.totalLabel}>
            Total:{' '}
            <Text style={styles.totalAmount}>{formatPriceMad(order.totalCents, currency)}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable style={[styles.btnGhost, shadow.card]} onPress={onViewDetails}>
          <Text style={styles.btnGhostTxt}>View Details</Text>
        </Pressable>
        {order.status === 'Pending' ? (
          <Pressable style={styles.btnSolid} onPress={onConfirm}>
            <Text style={styles.btnSolidTxt}>Confirm</Text>
          </Pressable>
        ) : null}
        {order.status === 'In Progress' ? (
          <Pressable style={styles.btnSolid} onPress={onMarkShipped}>
            <Text style={styles.btnSolidTxt}>Mark as Shipped</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topNav: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  topNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    gap: 4,
  },
  topNavItemActive: { backgroundColor: 'rgba(255, 102, 0, 0.12)' },
  topNavTxt: { ...typography.caption, fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  topNavTxtActive: { color: colors.marketplaceOrange, fontWeight: '800' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  placeholderTitle: { ...typography.title, fontSize: 18, color: colors.marketplaceTitle },
  placeholderBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  chipsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: colors.marketplaceOrange,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
  },
  chipTxt: { ...typography.caption, fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTxtActive: { color: colors.marketplaceOrange, fontWeight: '700' },
  listPad: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: { ...typography.body, color: colors.textDim, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderNum: { ...typography.title, fontSize: 15, color: colors.marketplaceTitle },
  orderDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 4, borderRadius: 8 },
  badgeTxt: { ...typography.caption, fontSize: 11, fontWeight: '700' },
  cardBody: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.border },
  cardMain: { flex: 1, gap: 4 },
  productTitle: { ...typography.title, fontSize: 14, color: colors.marketplaceTitle },
  unitPrice: { ...typography.body, fontWeight: '700', color: colors.marketplaceOrange },
  customerName: { ...typography.caption, color: colors.text },
  totalLabel: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  totalAmount: { fontWeight: '800', color: colors.marketplaceTitle },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  btnGhost: {
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.marketplaceOrange,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  btnGhostTxt: { ...typography.title, fontSize: 13, color: colors.marketplaceOrange },
  btnSolid: {
    flex: 1,
    minWidth: 100,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.marketplaceOrange,
    alignItems: 'center',
    shadowColor: colors.marketplaceOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSolidTxt: { ...typography.title, fontSize: 13, color: '#FFFFFF' },
});

export default SellerDashboardScreen;
