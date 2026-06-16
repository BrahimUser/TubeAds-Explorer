import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import { createOrderFromCheckout } from '../services/commerceFirestore';
import { getAd } from '../services/firestore';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad } from '../types/Ad';
import type { DeliveryMethod, PaymentMethod } from '../types/Commerce';
import { formatPriceMad } from '../utils/formatPrice';

type Props = StackScreenProps<RootStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation, route }: Props) {
  const { adId } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthUser();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    void (async () => {
      try {
        const doc = await getAd(adId);
        if (!alive) return;
        setAd(doc);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [adId]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', { mode: 'sign-in' });
    }
  }, [user, navigation]);

  const submit = async () => {
    if (!ad) return;
    const d = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      zip: zip.trim(),
    };
    if (!d.fullName || !d.phone || !d.address || !d.city || !d.zip) {
      Alert.alert('Missing information', 'Please fill in all delivery fields.');
      return;
    }
    setSubmitting(true);
    try {
      await createOrderFromCheckout({
        ad,
        delivery: d,
        deliveryMethod,
        paymentMethod,
      });
      Alert.alert('Order placed', 'You can track your order under My Orders.', [
        { text: 'OK', onPress: () => navigation.replace('Orders') },
      ]);
    } catch (e) {
      Alert.alert('Error', String((e as Error)?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} />
      </View>
    );
  }

  if (loading || !ad) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summary, shadow.card]}>
          <Text style={styles.summaryTitle}>{ad.title}</Text>
          <Text style={styles.summaryPrice}>{formatPriceMad(ad.priceCents, ad.currency)}</Text>
        </View>

        <Text style={styles.section}>Delivery</Text>
        {(
          [
            ['fullName', 'Full Name', fullName, setFullName] as const,
            ['phone', 'Phone Number', phone, setPhone] as const,
            ['address', 'Address', address, setAddress] as const,
            ['city', 'City', city, setCity] as const,
            ['zip', 'Zip Code', zip, setZip] as const,
          ] as const
        ).map(([key, label, val, setVal]) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={val}
              onChangeText={setVal}
              placeholder={label}
              placeholderTextColor={colors.textDim}
              autoCapitalize={key === 'address' || key === 'city' ? 'sentences' : 'words'}
              keyboardType={key === 'phone' || key === 'zip' ? 'phone-pad' : 'default'}
            />
          </View>
        ))}

        <Text style={styles.section}>Shipping method</Text>
        <View style={styles.row2}>
          <ChoiceTile
            label="Home Delivery"
            active={deliveryMethod === 'home'}
            onPress={() => setDeliveryMethod('home')}
          />
          <ChoiceTile
            label="Local Pickup"
            active={deliveryMethod === 'hand'}
            onPress={() => setDeliveryMethod('hand')}
          />
        </View>

        <Text style={styles.section}>Payment</Text>
        <View style={styles.row2}>
          <ChoiceTile
            label="Cash on Delivery"
            active={paymentMethod === 'cash'}
            onPress={() => setPaymentMethod('cash')}
          />
          <ChoiceTile
            label="Online Payment"
            active={paymentMethod === 'online'}
            onPress={() => setPaymentMethod('online')}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92 }, submitting && { opacity: 0.6 }]}
          onPress={() => void submit()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaTxt}>Confirm Order</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ChoiceTile({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        shadow.card,
        active && { borderColor: colors.marketplaceOrange, borderWidth: 2 },
      ]}
    >
      <Text style={[styles.choiceTxt, active && { color: colors.marketplaceOrange, fontWeight: '800' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  summary: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  summaryTitle: { ...typography.title, color: colors.marketplaceTitle, fontSize: 16 },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.marketplaceOrange,
    marginTop: spacing.sm,
  },
  section: {
    ...typography.title,
    fontSize: 15,
    color: colors.marketplaceTitle,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  field: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 4 },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    ...typography.body,
    color: colors.text,
  },
  row2: { gap: spacing.sm },
  choice: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  choiceTxt: { ...typography.body, color: colors.text },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.marketplaceOrange,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.marketplaceOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaTxt: { ...typography.title, color: '#FFFFFF', fontSize: 16 },
});

export default CheckoutScreen;
