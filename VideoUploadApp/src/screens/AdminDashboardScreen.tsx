import React, { useEffect, useState } from 'react';
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
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../hooks/useAuthUser';
import { useIsAdmin } from '../hooks/useIsAdmin';
import type { RootStackParamList } from '../navigation/types';
import { approveListing, listenToPendingAds, rejectListing } from '../services/listings';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad, Currency } from '../types/Ad';
import { formatPriceMad } from '../utils/formatPrice';
import { adsArraysEqual } from '../utils/shallowEqual';

type Props = {
  navigation: StackNavigationProp<RootStackParamList>;
  route?: RouteProp<RootStackParamList, 'AdminDashboard'>;
  isFocused?: boolean;
};

export function AdminDashboardScreen({ navigation, isFocused = true }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthUser();
  const { isAdmin, ready } = useIsAdmin();
  const [items, setItems] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Admin' });
  }, [navigation]);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', { mode: 'sign-in' });
      return;
    }
    if (!ready || !isAdmin || !isFocused) {
      if (!ready || !isAdmin) {
        setItems([]);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    const unsub = listenToPendingAds(
      (pending) => {
        setItems((prev) => (adsArraysEqual(prev, pending) ? prev : pending));
        setLoading(false);
      },
      (e) => {
        Alert.alert('Moderation', e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user?.uid, ready, isAdmin, navigation, isFocused]);

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} />
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.bodyMuted}>Checking access…</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.center, styles.pad, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Admins only</Text>
        <Text style={styles.bodyMuted}>Your account does not have the admin role.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.subhead}>Pending review ({items.length})</Text>
        <Text style={styles.caption}>
          Approvals sync with the website — the home feed shows approved listings only.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centergrow}>
          <ActivityIndicator color={colors.marketplaceOrange} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(ad) => ad.id}
          contentContainerStyle={styles.listPad}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews
          ListEmptyComponent={
            <Text style={styles.bodyMuted}>No listings waiting for moderation.</Text>
          }
          renderItem={({ item }) => (
            <ModerationCard
              item={item}
              busy={busy}
              onModerate={runModeration}
            />
          )}
        />
      )}
    </View>
  );

  async function runModeration(adId: string, kind: 'approve' | 'reject') {
    const key = `${adId}:${kind}`;
    setBusy(key);
    try {
      if (kind === 'approve') await approveListing(adId);
      else await rejectListing(adId);
    } catch (e) {
      Alert.alert('Action failed', String((e as Error)?.message ?? e));
    } finally {
      setBusy(null);
    }
  }
}

const ModerationCard = React.memo(function ModerationCard({
  item,
  busy,
  onModerate,
}: {
  item: Ad;
  busy: string | null;
  onModerate: (adId: string, kind: 'approve' | 'reject') => void;
}) {
  return (
    <View style={[styles.card, shadow.card]}>
      {!!item.thumbnailUrl && (
        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />
      )}
      <Text style={styles.adTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.price}>
        {formatPriceMad(item.priceCents, item.currency as Currency)}
      </Text>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnApprove, pressed && { opacity: 0.9 }]}
          disabled={!!busy}
          onPress={() => onModerate(item.id, 'approve')}
        >
          <Text style={styles.btnApproveTxt}>
            {busy === `${item.id}:approve` ? '…' : 'Approve'}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnReject, pressed && { opacity: 0.9 }]}
          disabled={!!busy}
          onPress={() => onModerate(item.id, 'reject')}
        >
          <Text style={styles.btnRejectTxt}>
            {busy === `${item.id}:reject` ? '…' : 'Reject'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centergrow: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pad: { paddingHorizontal: spacing.lg },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 4 },
  subhead: { ...typography.title, fontSize: 15, color: colors.marketplaceTitle },
  caption: { ...typography.caption, color: colors.textMuted },
  listPad: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  thumb: { width: '100%', height: 140, borderRadius: radii.sm, backgroundColor: colors.border },
  adTitle: { ...typography.title, fontSize: 16, color: colors.marketplaceTitle },
  price: { ...typography.body, color: colors.text, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  btnApprove: { backgroundColor: '#15803D' },
  btnApproveTxt: { ...typography.title, fontSize: 14, color: '#FFFFFF' },
  btnReject: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  btnRejectTxt: { ...typography.title, fontSize: 14, color: colors.danger },
  title: { ...typography.display, color: colors.marketplaceTitle },
  bodyMuted: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});

export default AdminDashboardScreen;
