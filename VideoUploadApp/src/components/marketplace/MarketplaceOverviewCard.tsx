import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { HomeMarketplaceStats } from '../../utils/homeMarketplaceStats';
import { colors, radii, spacing, typography } from '../../theme';

type Props = {
  stats: HomeMarketplaceStats;
};

type StatItemProps = {
  value: number;
  label: string;
  accent: string;
};

function StatItem({ value, label, accent }: StatItemProps) {
  return (
    <View style={styles.item}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export function MarketplaceOverviewCard({ stats }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{t('home.stats.title')}</Text>
      <View style={styles.row}>
        <StatItem
          value={stats.totalListings}
          label={t('home.stats.listingsShort')}
          accent={colors.marketplaceOrange}
        />
        <Divider />
        <StatItem
          value={stats.newThisWeek}
          label={t('home.stats.newShort')}
          accent={colors.secondary}
        />
        <Divider />
        <StatItem value={stats.activeCities} label={t('home.stats.citiesShort')} accent="#2563EB" />
        <Divider />
        <StatItem
          value={stats.activeCategories}
          label={t('home.stats.categoriesShort')}
          accent="#9333EA"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  caption: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  value: {
    ...typography.title,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  label: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
  },
});
