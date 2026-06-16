import React from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellOff, Trash2, X } from 'lucide-react-native';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { NotificationItem } from '../data/mockNotifications';
import { formatRelativeTimeEn } from '../utils/formatRelativeTimeEn';

const LOGO = require('../../assets/images/logo.png');

type Props = {
  visible: boolean;
  items: NotificationItem[];
  onClose: () => void;
  onClear: () => void;
};

/**
 * Bottom-sheet style notifications history.
 *
 * Stays purely presentational — receives items + handlers from the
 * caller so the same component can later be fed real Firestore data
 * without touching the UI.
 */
export function NotificationsModal({ visible, items, onClose, onClear }: Props) {
  const insets = useSafeAreaInsets();
  const hasItems = items.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close notifications"
      >
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.headerActions}>
              {hasItems ? (
                <Pressable
                  onPress={onClear}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all notifications"
                >
                  <Trash2 size={14} color={colors.marketplaceOrange} strokeWidth={2} />
                  <Text style={styles.clearLabel}>Clear all</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onClose}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={22} color={colors.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {hasItems ? (
            <FlatList
              data={items}
              keyExtractor={(it) => it.id}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => <Row item={item} />}
            />
          ) : (
            <Empty />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ item }: { item: NotificationItem }) {
  const headline =
    item.kind === 'message'
      ? `User ${item.senderName ?? 'Someone'} sent you a message.`
      : `New order ${item.orderId ?? ''} has been placed.`;

  return (
    <View style={styles.row}>
      <View style={[styles.thumbWrap, shadow.card]}>
        <Image source={LOGO} style={styles.thumb} resizeMode="contain" />
      </View>

      <View style={styles.body}>
        <Text style={styles.headline} numberOfLines={2}>
          {headline}
        </Text>
        {item.preview ? (
          <Text style={styles.preview} numberOfLines={1}>
            {item.preview}
          </Text>
        ) : null}
        <Text style={styles.time}>{formatRelativeTimeEn(item.createdAtMs)}</Text>
      </View>

      {!item.read ? <View style={styles.unreadDot} /> : null}
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <BellOff size={28} color={colors.textDim} strokeWidth={1.75} />
      </View>
      <Text style={styles.emptyTitle}>You're all caught up</Text>
      <Text style={styles.emptySub}>
        Messages and order updates will show up here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.title,
    fontSize: 19,
    fontWeight: '800',
    color: colors.marketplaceTitle,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.marketplaceOrange,
    backgroundColor: 'rgba(255, 102, 0, 0.08)',
  },
  clearLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.marketplaceOrange,
    letterSpacing: 0.2,
  },
  closeBtn: { padding: 4 },
  listContent: {
    paddingVertical: spacing.sm,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 48 + spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  thumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 32,
    height: 32,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  headline: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.marketplaceTitle,
    lineHeight: 19,
  },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
  },
  time: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.marketplaceOrange,
    marginLeft: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.marketplaceTitle,
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
  },
});

export default NotificationsModal;
