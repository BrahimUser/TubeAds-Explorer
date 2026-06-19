import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, MessageCircle, ShoppingBag, Store, Tag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import { listenChatThreads } from '../services/chat';
import {
  fetchUser,
  normalizeUserProfile,
  sellerDisplayName,
  type SellerProfile,
} from '../services/users';
import { colors, radii, spacing, typography } from '../theme';
import type { ChatThread } from '../types/Commerce';
import { formatRelativeTimeEn } from '../utils/formatRelativeTimeEn';
import { formatRelativeTimeFr } from '../utils/formatRelativeTimeFr';

const H_PAD = spacing.lg;

function otherParticipantUid(thread: ChatThread, myUid: string): string {
  if (thread.sellerUid && thread.sellerUid !== myUid) return thread.sellerUid;
  if (thread.buyerUid && thread.buyerUid !== myUid) return thread.buyerUid;
  return thread.participantIds.find((u) => u && u !== myUid) ?? '';
}

function isoToMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function formatRelativeForLocale(lang: string, ms: number | null | undefined): string {
  const code = lang.split('-')[0];
  if (code === 'fr') return formatRelativeTimeFr(ms);
  return formatRelativeTimeEn(ms);
}

function avatarInitial(name: string): string {
  const c = name.trim()[0];
  return c ? c.toUpperCase() : '?';
}

const ThreadRow = React.memo(function ThreadRow({
  item,
  myUid,
  profile,
  timeLabel,
  roleLabel,
  onPress,
}: {
  item: ChatThread;
  myUid: string;
  profile: SellerProfile | null;
  timeLabel: string;
  roleLabel: string;
  onPress: (thread: ChatThread) => void;
}) {
  const otherUid = otherParticipantUid(item, myUid);
  const contactName = sellerDisplayName(profile, otherUid);
  const preview = item.lastMessageText?.trim() || '';

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${contactName}, ${item.productTitle}`}
    >
      <View style={styles.thumbStack}>
        <View style={styles.productThumbWrap}>
          {item.productThumb ? (
            <Image source={{ uri: item.productThumb }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.productThumb, styles.productThumbFallback]}>
              <Tag size={20} color={colors.textDim} strokeWidth={1.75} />
            </View>
          )}
        </View>
        <View style={styles.contactAvatar}>
          {profile?.shopLogoUrl ? (
            <Image source={{ uri: profile.shopLogoUrl }} style={styles.contactAvatarImg} resizeMode="cover" />
          ) : (
            <View style={styles.contactAvatarFallback}>
              <Text style={styles.contactAvatarLetter}>{avatarInitial(contactName)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contactName}
          </Text>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
        </View>

        <View style={styles.roleRow}>
          <View style={styles.roleChip}>
            {myUid === item.buyerUid ? (
              <ShoppingBag size={10} color={colors.secondary} strokeWidth={2.25} />
            ) : (
              <Store size={10} color={colors.marketplaceOrange} strokeWidth={2.25} />
            )}
            <Text style={styles.roleChipText}>{roleLabel}</Text>
          </View>
          {profile?.isPro ? (
            <View style={styles.proChip}>
              <Text style={styles.proChipText}>Pro</Text>
            </View>
          ) : null}
        </View>

        {item.productTitle ? (
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.productTitle}
          </Text>
        ) : null}

        <Text style={[styles.preview, !preview && styles.previewMuted]} numberOfLines={2}>
          {preview || '—'}
        </Text>

        {item.priceLabel ? (
          <Text style={styles.price} numberOfLines={1}>
            {item.priceLabel}
          </Text>
        ) : null}
      </View>

      <ChevronRight size={18} color={colors.textDim} style={styles.chevron} />
    </Pressable>
  );
});

function InboxHeader({ count, subtitle, title }: { title: string; subtitle: string; count?: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
      {count != null ? (
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ThreadSkeleton() {
  return (
    <View style={styles.skeletonRow}>
      <View style={styles.skeletonThumb} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineWide} />
        <View style={styles.skeletonLineMid} />
        <View style={styles.skeletonLineFull} />
      </View>
    </View>
  );
}

export function ChatInboxScreen({ isFocused = true }: { isFocused?: boolean }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuthUser();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, SellerProfile>>({});

  useEffect(() => {
    if (!user?.uid || !isFocused) {
      if (!user?.uid) {
        setThreads([]);
        setLoading(false);
      }
      return;
    }
    const unsub = listenChatThreads(
      (list) => {
        setThreads(list);
        setLoading(false);
      },
      (e) => {
        Alert.alert(t('messagesInbox.title'), e.message);
        setLoading(false);
      },
      { enabled: isFocused },
    );
    return unsub;
  }, [user?.uid, isFocused, t]);

  useEffect(() => {
    if (!user?.uid || threads.length === 0) {
      setProfiles({});
      return;
    }

    const uids = [
      ...new Set(threads.map((thread) => otherParticipantUid(thread, user.uid)).filter(Boolean)),
    ];
    let alive = true;

    void Promise.all(
      uids.map(async (uid) => {
        try {
          const profile = await fetchUser(uid);
          return [uid, profile] as const;
        } catch {
          return [uid, normalizeUserProfile(uid, null)] as const;
        }
      }),
    ).then((entries) => {
      if (!alive) return;
      setProfiles(Object.fromEntries(entries));
    });

    return () => {
      alive = false;
    };
  }, [threads, user?.uid]);

  const openThread = useCallback(
    (thread: ChatThread) => {
      if (!user?.uid) return;
      const sellerUid = user.uid === thread.buyerUid ? thread.sellerUid : thread.buyerUid;
      navigation.navigate('Chat', { threadId: thread.id, adId: thread.adId, sellerUid });
    },
    [navigation, user?.uid],
  );

  const browseListings = useCallback(() => {
    navigation.navigate('Main', { tab: 'home' });
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: ChatThread }) => {
      if (!user?.uid) return null;
      const otherUid = otherParticipantUid(item, user.uid);
      const profile = profiles[otherUid] ?? null;
      const timeLabel = formatRelativeForLocale(
        i18n.language,
        isoToMs(item.lastMessageAt || item.createdAt),
      );
      const roleLabel =
        user.uid === item.buyerUid
          ? t('messagesInbox.roleBuying')
          : t('messagesInbox.roleSelling');

      return (
        <ThreadRow
          item={item}
          myUid={user.uid}
          profile={profile}
          timeLabel={timeLabel}
          roleLabel={roleLabel}
          onPress={openThread}
        />
      );
    },
    [user?.uid, profiles, i18n.language, t, openThread],
  );

  const keyExtractor = useCallback((thread: ChatThread) => thread.id, []);

  const header = useMemo(
    () => (
      <InboxHeader
        title={t('messagesInbox.title')}
        subtitle={t('messagesInbox.subtitle')}
        count={threads.length > 0 ? threads.length : undefined}
      />
    ),
    [t, threads.length],
  );

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <InboxHeader title={t('messagesInbox.title')} subtitle={t('messagesInbox.subtitle')} />
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <MessageCircle size={28} color={colors.marketplaceOrange} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>{t('messagesInbox.signedOutTitle')}</Text>
          <Text style={styles.emptyBody}>{t('messagesInbox.signedOutBody')}</Text>
          <Button
            label={t('account.signIn')}
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Auth', { mode: 'sign-in' })}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <InboxHeader title={t('messagesInbox.title')} subtitle={t('messagesInbox.subtitle')} />
        <View style={styles.skeletonList}>
          <ThreadSkeleton />
          <ThreadSkeleton />
          <ThreadSkeleton />
        </View>
      </View>
    );
  }

  if (threads.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <InboxHeader title={t('messagesInbox.title')} subtitle={t('messagesInbox.subtitle')} />
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <MessageCircle size={28} color={colors.textDim} strokeWidth={1.75} />
          </View>
          <Text style={styles.emptyTitle}>{t('messagesInbox.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('messagesInbox.emptyBody')}</Text>
          <Button
            label={t('messagesInbox.browseListings')}
            variant="secondary"
            size="lg"
            onPress={browseListings}
            style={styles.primaryBtn}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        style={styles.listFlex}
        data={threads}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listFlex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 4 },
  headerTitle: {
    ...typography.display,
    fontSize: 24,
    fontWeight: '800',
    color: colors.marketplaceTitle,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    ...typography.body,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  countPill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    ...typography.label,
    color: colors.marketplaceOrange,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    overflow: 'hidden',
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: H_PAD + 56 + spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: H_PAD,
    paddingVertical: spacing.md + 2,
    backgroundColor: colors.surface,
  },
  rowPressed: { backgroundColor: colors.whiteAlpha },
  thumbStack: {
    width: 56,
    height: 56,
  },
  productThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productThumb: { width: '100%', height: '100%' },
  productThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  contactAvatar: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  contactAvatarImg: { width: '100%', height: '100%' },
  contactAvatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondarySubtle,
  },
  contactAvatarLetter: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.secondary,
  },
  rowBody: { flex: 1, gap: 3, minWidth: 0 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactName: {
    ...typography.title,
    fontSize: 15,
    color: colors.marketplaceTitle,
    flex: 1,
  },
  time: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 1,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: '#F4F4F5',
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
  proChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.brandSubtle,
  },
  proChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.marketplaceOrange,
    letterSpacing: 0.3,
  },
  productTitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  preview: {
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  previewMuted: {
    color: colors.textDim,
    fontStyle: 'italic',
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.marketplaceOrange,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  chevron: { marginLeft: -4 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.marketplaceTitle,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryBtn: { marginTop: spacing.md, alignSelf: 'stretch' },
  skeletonList: {
    marginTop: spacing.md,
    marginHorizontal: H_PAD,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  skeletonThumb: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: '#ECECEF',
  },
  skeletonBody: { flex: 1, gap: spacing.sm },
  skeletonLineWide: {
    width: '55%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ECECEF',
  },
  skeletonLineMid: {
    width: '35%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F3',
  },
  skeletonLineFull: {
    width: '85%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F3',
  },
});

export default ChatInboxScreen;
