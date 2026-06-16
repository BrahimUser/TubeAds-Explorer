import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Armchair,
  Briefcase,
  Building2,
  Car,
  CircleHelp,
  LampDesk,
  LayoutGrid,
  Layers,
  Shirt,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import type { CategoryId } from '../../config/marketplace';
import { CATEGORY_CHIP_ORDER, CATEGORY_VISUAL } from '../../config/marketplaceUi';
import { colors, radii, spacing, typography } from '../../theme';

const SQUARE = 72;

function iconFor(id: CategoryId | null): LucideIcon {
  if (id === null) return LayoutGrid;
  const m: Record<CategoryId, LucideIcon> = {
    rugs: Layers,
    electronics: LampDesk,
    vehicles: Car,
    'real-estate': Building2,
    fashion: Shirt,
    home: Armchair,
    jobs: Briefcase,
    services: Wrench,
    other: CircleHelp,
  };
  return m[id] ?? CircleHelp;
}

type Props = {
  value: CategoryId | null;
  onChange: (next: CategoryId | null) => void;
};

export function MarketplaceCategorySquares({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Square
        label={t('categories.all')}
        Icon={LayoutGrid}
        selected={value === null}
        onPress={() => onChange(null)}
      />
      {CATEGORY_CHIP_ORDER.map((id) => (
        <Square
          key={id}
          label={t(`categories.${id}`)}
          Icon={iconFor(id)}
          selected={value === id}
          onPress={() => onChange(id)}
          categoryId={id}
        />
      ))}
    </ScrollView>
  );
}

function Square({
  label,
  Icon,
  selected,
  onPress,
  categoryId,
}: {
  label: string;
  Icon: LucideIcon;
  selected: boolean;
  onPress: () => void;
  categoryId?: CategoryId;
}) {
  const vis = categoryId ? CATEGORY_VISUAL[categoryId] : null;
  const bg = selected
    ? colors.marketplaceOrange
    : vis?.iconBg ?? colors.surface;
  const iconColor = selected ? '#FFFFFF' : vis?.iconColor ?? colors.textMuted;

  return (
    <Pressable onPress={onPress} style={styles.cell}>
      <View style={[styles.square, { backgroundColor: bg }]}>
        <Icon size={28} color={iconColor} strokeWidth={1.75} />
      </View>
      <Text
        style={[styles.label, { color: selected ? colors.marketplaceOrange : colors.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    alignItems: 'flex-start',
    paddingBottom: spacing.xs,
  },
  cell: {
    width: SQUARE + 8,
    alignItems: 'center',
    gap: 6,
  },
  square: {
    width: SQUARE,
    height: SQUARE,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: SQUARE + 16,
  },
});
