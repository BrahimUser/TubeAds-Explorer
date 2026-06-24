import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function HomeSectionHeader({ title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight size={16} color={colors.marketplaceOrange} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
  title: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '800',
    color: colors.marketplaceTitle,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  actionText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.marketplaceOrange,
  },
});
