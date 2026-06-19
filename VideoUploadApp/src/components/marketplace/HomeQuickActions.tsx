import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Heart, LayoutGrid, MessageCircle, PlusCircle } from 'lucide-react-native';
import { colors, radii, shadow, spacing, typography } from '../../theme';

type ActionId = 'sell' | 'favorites' | 'messages' | 'browse';

type Props = {
  onAction: (id: ActionId) => void;
};

const ACTIONS: {
  id: ActionId;
  Icon: typeof PlusCircle;
  color: string;
  bg: string;
  primary?: boolean;
}[] = [
  { id: 'sell', Icon: PlusCircle, color: '#FFFFFF', bg: colors.marketplaceOrange, primary: true },
  { id: 'favorites', Icon: Heart, color: '#E11D48', bg: '#FFE4E6' },
  { id: 'messages', Icon: MessageCircle, color: colors.secondary, bg: colors.secondarySubtle },
  { id: 'browse', Icon: LayoutGrid, color: '#2563EB', bg: '#EFF6FF' },
];

export function HomeQuickActions({ onAction }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {ACTIONS.map(({ id, Icon, color, bg, primary }) => (
        <Pressable
          key={id}
          onPress={() => onAction(id)}
          style={({ pressed }) => [
            styles.cell,
            primary && styles.cellPrimary,
            primary && shadow.cta,
            pressed && { opacity: 0.88 },
          ]}
          accessibilityRole="button"
        >
          <View style={[styles.iconWrap, { backgroundColor: primary ? 'rgba(255,255,255,0.22)' : bg }]}>
            <Icon size={22} color={primary ? '#FFFFFF' : color} strokeWidth={1.75} />
          </View>
          <Text style={[styles.label, primary && styles.labelPrimary]}>
            {t(`home.quickActions.${id}`)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    ...shadow.pill,
  },
  cellPrimary: {
    backgroundColor: colors.marketplaceOrange,
    borderColor: colors.marketplaceOrange,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelPrimary: {
    color: '#FFFFFF',
  },
});
