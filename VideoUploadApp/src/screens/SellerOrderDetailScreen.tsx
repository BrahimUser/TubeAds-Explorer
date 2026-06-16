import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import { findChatThreadForOrder } from '../services/chat';
import { getOrder, sellerAdvanceOrder } from '../services/orders';
import { apiDateToMs } from '../utils/apiMappers';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Order } from '../types/Commerce';
import { formatPriceMad } from '../utils/formatPrice';
import type { Currency } from '../types/Ad';

type Props = StackScreenProps<RootStackParamList, 'SellerOrderDetail'>;

function shippingLabel(method: Order['deliveryMethod']): string {
  return method === 'home' ? 'Home Delivery' : 'Local Pickup';
}

function paymentLabel(method: Order['paymentMethod']): string {
  return method === 'cash' ? 'Payment on Delivery' : 'Online Payment';
}

function orderDateLabel(order: Order): string {
  const ms = apiDateToMs(order.createdAt);
  if (ms == null) return '—';
  try {
    return new Date(ms).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function SellerOrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const o = await getOrder(orderId);
        if (!alive) return;
        if (!o || (user && o.sellerUid !== user.uid)) {
          setOrder(null);
          return;
        }
        setOrder(o);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId, user?.uid]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!user) navigation.replace('Auth', { mode: 'sign-in' });
  }, [user, navigation]);

  const primaryAction = () => {
    if (!order) return;
    if (order.status === 'Pending') return 'Confirm Order';
    if (order.status === 'In Progress') return 'Mark as Shipped';
    return null;
  };

  const runPrimary = async () => {
    if (!order) return;
    setActing(true);
    try {
      if (order.status === 'Pending') {
        await sellerAdvanceOrder(order.id, 'confirm');
      } else if (order.status === 'In Progress') {
        await sellerAdvanceOrder(order.id, 'mark_shipped');
      }
      load();
    } catch (e) {
      Alert.alert('Unable to update order', String((e as Error)?.message ?? e));
    } finally {
      setActing(false);
    }
  };

  const contactCustomer = async () => {
    if (!order) return;
    setActing(true);
    try {
      const threadId = await findChatThreadForOrder(
        order.adId,
        order.buyerUid,
        order.sellerUid,
      );
      if (!threadId) {
        Alert.alert(
          'No conversation yet',
          'The buyer has not started a chat on this listing.',
        );
        return;
      }
      navigation.navigate('Chat', {
        threadId,
        adId: order.adId,
        sellerUid: order.sellerUid,
      });
    } catch (e) {
      Alert.alert('Messages', String((e as Error)?.message ?? e));
    } finally {
      setActing(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        <Text style={styles.err}>Order not found or you do not have access.</Text>
      </View>
    );
  }

  const currency = order.currency as Currency;
  const primary = primaryAction();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.orderNum}>{order.orderNumber}</Text>
        <Text style={styles.meta}>{orderDateLabel(order)}</Text>

        <View style={[styles.productRow, shadow.card]}>
          <Image source={{ uri: order.adThumbnailUrl }} style={styles.thumb} resizeMode="cover" />
          <View style={styles.productTxt}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {order.adTitle}
            </Text>
            <Text style={styles.statusPill}>{order.status}</Text>
          </View>
        </View>

        <Text style={styles.section}>Customer Information</Text>
        <View style={[styles.box, shadow.card]}>
          <Row label="Name" value={order.delivery.fullName} />
          <Row label="Phone" value={order.delivery.phone} />
        </View>

        <Text style={styles.section}>Shipping</Text>
        <View style={[styles.box, shadow.card]}>
          <Row label="Method" value={shippingLabel(order.deliveryMethod)} />
          <Row label="Address" value={order.delivery.address} />
          <Row label="City" value={order.delivery.city} />
          <Row label="Zip Code" value={order.delivery.zip} />
        </View>

        <Text style={styles.section}>Payment</Text>
        <View style={[styles.box, shadow.card]}>
          <Row label="Method" value={paymentLabel(order.paymentMethod)} />
        </View>

        <Text style={styles.section}>Summary</Text>
        <View style={[styles.box, shadow.card]}>
          <Row
            label="Sub-total"
            value={formatPriceMad(order.subtotalCents, currency)}
            strongValue
          />
          <Row
            label="Shipping fees"
            value={formatPriceMad(order.shippingFeeCents, currency)}
          />
          <View style={styles.divider} />
          <Row label="Total" value={formatPriceMad(order.totalCents, currency)} strongValue strongLabel />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={[styles.outlineBtn, acting && { opacity: 0.7 }]}
          onPress={() => void contactCustomer()}
          disabled={acting}
        >
          <Text style={styles.outlineBtnTxt}>Contact Customer</Text>
        </Pressable>
        {primary ? (
          <Pressable
            style={[styles.solidBtn, acting && { opacity: 0.7 }]}
            onPress={() => void runPrimary()}
            disabled={acting}
          >
            <Text style={styles.solidBtnTxt}>
              {primary === 'Confirm Order' ? 'Confirm Order' : 'Mark as Shipped'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  strongLabel,
  strongValue,
}: {
  label: string;
  value: string;
  strongLabel?: boolean;
  strongValue?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strongLabel && styles.rowLabelStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strongValue && styles.rowValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 140 },
  orderNum: { ...typography.display, fontSize: 20, color: colors.marketplaceTitle },
  meta: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  productRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  thumb: { width: 80, height: 80, borderRadius: radii.md, backgroundColor: colors.border },
  productTxt: { flex: 1, justifyContent: 'center', gap: 8 },
  productTitle: { ...typography.title, fontSize: 15, color: colors.marketplaceTitle },
  statusPill: {
    alignSelf: 'flex-start',
    ...typography.caption,
    fontWeight: '700',
    color: colors.marketplaceOrange,
    backgroundColor: 'rgba(255, 102, 0, 0.12)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  section: {
    ...typography.title,
    fontSize: 15,
    color: colors.marketplaceTitle,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  box: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { gap: 2 },
  rowLabel: { ...typography.caption, color: colors.textMuted },
  rowLabelStrong: { ...typography.title, fontSize: 14, color: colors.marketplaceTitle },
  rowValue: { ...typography.body, color: colors.text },
  rowValueStrong: { ...typography.title, fontSize: 15, color: colors.marketplaceOrange },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  footer: {
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
  outlineBtn: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.marketplaceOrange,
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  outlineBtnTxt: { ...typography.title, fontSize: 14, color: colors.marketplaceOrange },
  solidBtn: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.md,
    backgroundColor: colors.marketplaceOrange,
    alignItems: 'center',
  },
  solidBtnTxt: { ...typography.title, fontSize: 14, color: '#FFFFFF' },
  err: { ...typography.body, color: colors.danger, textAlign: 'center' },
});

export default SellerOrderDetailScreen;
