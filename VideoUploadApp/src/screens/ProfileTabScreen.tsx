import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Heart,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Shield,
  Store,
  UserRound,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useAuthUser } from '../hooks/useAuthUser';
import { useIsAdmin } from '../hooks/useIsAdmin';
import type { MainTabKey, RootStackParamList } from '../navigation/types';
import { signOut } from '../services/auth';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { AppUser } from '../types/AppUser';

function accountDisplayName(user: AppUser): string {
  return user.shopName?.trim() || user.displayName?.trim() || 'User';
}

function accountAvatarLetter(user: AppUser): string {
  const label = accountDisplayName(user);
  return label.charAt(0).toUpperCase() || '?';
}

function AccountBenefit({
  Icon,
  title,
  body,
}: {
  Icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIcon}>
        <Icon size={20} color={colors.marketplaceOrange} strokeWidth={2} />
      </View>
      <View style={styles.benefitCopy}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitBody}>{body}</Text>
      </View>
    </View>
  );
}

function AccountMenuItem({
  Icon,
  label,
  hint,
  onPress,
  danger,
}: {
  Icon: LucideIcon;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View style={[styles.menuItemIcon, danger && styles.menuItemIconDanger]}>
        <Icon
          size={20}
          color={danger ? colors.danger : colors.marketplaceOrange}
          strokeWidth={2}
        />
      </View>
      <View style={styles.menuItemCopy}>
        <Text style={[styles.menuItemLabel, danger && styles.menuItemLabelDanger]}>{label}</Text>
        {hint ? <Text style={styles.menuItemHint}>{hint}</Text> : null}
      </View>
      {!danger ? <ChevronRight size={18} color={colors.textDim} strokeWidth={2} /> : null}
    </Pressable>
  );
}

function AccountSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={[styles.sectionCard, shadow.card]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function SignedOutAccount({ onSignIn, onSignUp }: { onSignIn: () => void; onSignUp: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screenRoot, { paddingTop: insets.top }]}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenHeaderTitle}>{t('account.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.screenScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.heroCard, shadow.card]}>
          <View style={styles.heroIconWrap}>
            <UserRound size={34} color={colors.marketplaceOrange} strokeWidth={1.75} />
          </View>
          <Text style={styles.heroTitle}>{t('account.signedOutTitle')}</Text>
          <Text style={styles.heroBody}>{t('account.signedOutBody')}</Text>
        </View>

        <View style={[styles.benefitsCard, shadow.card]}>
          <Text style={styles.benefitsHeading}>{t('account.benefitsHeading')}</Text>
          <AccountBenefit
            Icon={Heart}
            title={t('account.benefitFavoritesTitle')}
            body={t('account.benefitFavoritesBody')}
          />
          <View style={styles.benefitDivider} />
          <AccountBenefit
            Icon={MessageCircle}
            title={t('account.benefitMessagesTitle')}
            body={t('account.benefitMessagesBody')}
          />
          <View style={styles.benefitDivider} />
          <AccountBenefit
            Icon={Package}
            title={t('account.benefitOrdersTitle')}
            body={t('account.benefitOrdersBody')}
          />
          <View style={styles.benefitDivider} />
          <AccountBenefit
            Icon={Store}
            title={t('account.benefitSellTitle')}
            body={t('account.benefitSellBody')}
          />
        </View>

        <View style={styles.ctaBlock}>
          <Button label={t('account.signIn')} variant="primary" size="lg" onPress={onSignIn} />
          <Button
            label={t('account.createAccount')}
            variant="secondary"
            size="lg"
            onPress={onSignUp}
          />
        </View>

        <View style={styles.trustRow}>
          <Shield size={14} color={colors.secondary} strokeWidth={2} />
          <Text style={styles.trustText}>{t('account.trustNote')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SignedInAccount({
  user,
  isAdmin,
  adminReady,
  onOpenTab,
  onPostAd,
  onViewShop,
  onOrders,
  onSellerDashboard,
  onAdminDashboard,
  onSignOut,
}: {
  user: AppUser;
  isAdmin: boolean;
  adminReady: boolean;
  onOpenTab: (tab: MainTabKey) => void;
  onPostAd: () => void;
  onViewShop: () => void;
  onOrders: () => void;
  onSellerDashboard: () => void;
  onAdminDashboard: () => void;
  onSignOut: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const displayName = accountDisplayName(user);

  return (
    <View style={[styles.screenRoot, { paddingTop: insets.top }]}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenHeaderTitle}>{t('account.title')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.screenScroll}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.profileCard, shadow.card]}
          onPress={onViewShop}
          accessibilityRole="button"
          accessibilityLabel={t('account.viewShop')}
        >
          {user.shopLogoUrl ? (
            <Image source={{ uri: user.shopLogoUrl }} style={styles.profileAvatarImage} />
          ) : (
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarTxt}>{accountAvatarLetter(user)}</Text>
            </View>
          )}
          <View style={styles.profileCopy}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayName}
              </Text>
              {user.isPro ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeTxt}>{t('account.proBadge')}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.profilePhone} numberOfLines={1}>
              {user.phoneNumber}
            </Text>
            <Text style={styles.profileLink}>{t('account.viewShop')}</Text>
          </View>
          <ChevronRight size={20} color={colors.textDim} strokeWidth={2} />
        </Pressable>

        <Button
          label={t('account.postAd')}
          variant="primary"
          size="lg"
          onPress={onPostAd}
          leading={<Plus size={18} color="#FFFFFF" strokeWidth={2.5} />}
        />

        <AccountSection title={t('account.sectionShopping')}>
          <AccountMenuItem
            Icon={Package}
            label={t('account.myOrders')}
            hint={t('account.myOrdersHint')}
            onPress={onOrders}
          />
          <View style={styles.menuDivider} />
          <AccountMenuItem
            Icon={Heart}
            label={t('account.favorites')}
            hint={t('account.favoritesHint')}
            onPress={() => onOpenTab('favorites')}
          />
          <View style={styles.menuDivider} />
          <AccountMenuItem
            Icon={MessageCircle}
            label={t('account.messages')}
            hint={t('account.messagesHint')}
            onPress={() => onOpenTab('messages')}
          />
        </AccountSection>

        <AccountSection title={t('account.sectionSelling')}>
          <AccountMenuItem
            Icon={Store}
            label={t('account.sellerDashboard')}
            hint={t('account.sellerDashboardHint')}
            onPress={onSellerDashboard}
          />
          <View style={styles.menuDivider} />
          <AccountMenuItem
            Icon={UserRound}
            label={t('account.viewShop')}
            hint={t('account.viewShopHint')}
            onPress={onViewShop}
          />
        </AccountSection>

        {adminReady && isAdmin ? (
          <AccountSection title={t('account.sectionAdmin')}>
            <AccountMenuItem
              Icon={Shield}
              label={t('account.adminDashboard')}
              hint={t('account.adminDashboardHint')}
              onPress={onAdminDashboard}
            />
          </AccountSection>
        ) : null}

        <Pressable
          style={styles.signOutBtn}
          onPress={onSignOut}
          accessibilityRole="button"
        >
          <LogOut size={18} color={colors.danger} strokeWidth={2} />
          <Text style={styles.signOutTxt}>{t('account.signOut')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function ProfileTabScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuthUser();
  const { isAdmin, ready: adminReady } = useIsAdmin();

  const confirmSignOut = () => {
    Alert.alert(t('account.signOutTitle'), t('account.signOutBody'), [
      { text: t('account.signOutCancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  if (!user) {
    return (
      <SignedOutAccount
        onSignIn={() => navigation.navigate('Auth', { mode: 'sign-in' })}
        onSignUp={() => navigation.navigate('Auth', { mode: 'sign-up' })}
      />
    );
  }

  return (
    <SignedInAccount
      user={user}
      isAdmin={isAdmin}
      adminReady={adminReady}
      onOpenTab={(tab) => navigation.navigate('Main', { tab })}
      onPostAd={() => navigation.navigate('PostAd')}
      onViewShop={() => navigation.navigate('SellerProfile', { sellerId: user.uid })}
      onOrders={() => navigation.navigate('Orders')}
      onSellerDashboard={() => navigation.navigate('SellerDashboard')}
      onAdminDashboard={() => navigation.navigate('AdminDashboard')}
      onSignOut={confirmSignOut}
    />
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceElevated,
  },
  screenHeaderTitle: {
    ...typography.display,
    fontSize: 24,
    color: colors.marketplaceTitle,
    letterSpacing: -0.4,
  },
  screenScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 102, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 102, 0, 0.18)',
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.title,
    fontSize: 20,
    color: colors.marketplaceTitle,
    textAlign: 'center',
  },
  heroBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  benefitsCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  benefitsHeading: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: {
    flex: 1,
    gap: 2,
  },
  benefitTitle: {
    ...typography.title,
    fontSize: 15,
    color: colors.marketplaceTitle,
  },
  benefitBody: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 19,
  },
  benefitDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  ctaBlock: {
    gap: spacing.sm,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trustText: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: 'center',
    flex: 1,
    lineHeight: 17,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 102, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.border,
  },
  profileAvatarTxt: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.marketplaceOrange,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  profileName: {
    ...typography.title,
    fontSize: 17,
    color: colors.marketplaceTitle,
    flexShrink: 1,
  },
  proBadge: {
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  proBadgeTxt: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  profilePhone: {
    ...typography.caption,
    color: colors.textMuted,
  },
  profileLink: {
    ...typography.caption,
    color: colors.marketplaceOrange,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255, 102, 0, 0.05)',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemIconDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
  },
  menuItemCopy: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    ...typography.title,
    fontSize: 15,
    color: colors.marketplaceTitle,
  },
  menuItemLabelDanger: {
    color: colors.danger,
  },
  menuItemHint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutTxt: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '600',
  },
});

export default ProfileTabScreen;
