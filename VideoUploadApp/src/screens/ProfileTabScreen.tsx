import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Package, Shield, Store, UserRound } from 'lucide-react-native';
import { useAuthUser } from '../hooks/useAuthUser';
import { useIsAdmin } from '../hooks/useIsAdmin';
import type { RootStackParamList } from '../navigation/types';
import { signOut } from '../services/auth';
import { colors, radii, shadow, spacing, typography } from '../theme';

export function ProfileTabScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuthUser();
  const { isAdmin, ready: adminReady } = useIsAdmin();

  if (!user) {
    return (
      <View style={styles.center}>
        <UserRound size={48} color={colors.textDim} strokeWidth={1.5} />
        <Text style={styles.title}>{t('tabs.profile')}</Text>
        <Text style={styles.sub}>Sign in to manage your orders.</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Auth', { mode: 'sign-in' })}
        >
          <Text style={styles.primaryBtnTxt}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, shadow.card]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>
            {(user.displayName ?? user.email ?? '?').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerTxt}>
          <Text style={styles.name} numberOfLines={1}>
            {user.displayName || 'User'}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email ?? user.uid}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.menuRow, shadow.card]}
        onPress={() => navigation.navigate('SellerDashboard')}
      >
        <Store size={22} color={colors.marketplaceOrange} strokeWidth={2} />
        <Text style={styles.menuLabel}>Seller dashboard</Text>
      </Pressable>

      {adminReady && isAdmin && (
        <Pressable
          style={[styles.menuRow, shadow.card]}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Shield size={22} color={colors.marketplaceOrange} strokeWidth={2} />
          <Text style={styles.menuLabel}>Admin dashboard</Text>
        </Pressable>
      )}

      <Pressable
        style={[styles.menuRow, shadow.card]}
        onPress={() => navigation.navigate('Orders')}
      >
        <Package size={22} color={colors.marketplaceOrange} strokeWidth={2} />
        <Text style={styles.menuLabel}>My Orders</Text>
      </Pressable>

      <Pressable
        style={styles.signOut}
        onPress={() => {
          Alert.alert('Sign out', 'Sign out of this account?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
          ]);
        }}
      >
        <Text style={styles.signOutTxt}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.md },
  title: { ...typography.display, color: colors.marketplaceTitle },
  sub: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.marketplaceOrange,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  primaryBtnTxt: { ...typography.title, color: '#FFFFFF' },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 102, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 22, fontWeight: '800', color: colors.marketplaceOrange },
  headerTxt: { flex: 1, gap: 4 },
  name: { ...typography.title, fontSize: 17, color: colors.marketplaceTitle },
  email: { ...typography.caption, color: colors.textMuted },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLabel: { ...typography.title, fontSize: 15, color: colors.marketplaceTitle },
  signOut: { paddingVertical: spacing.md, alignItems: 'center' },
  signOutTxt: { ...typography.body, color: colors.danger, fontWeight: '600' },
});

export default ProfileTabScreen;
