import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { cityLabel, type CityId } from '../../config/marketplace';
import type { CityListingCount } from '../../utils/homeMarketplaceStats';
import { HomeSectionHeader } from './HomeSectionHeader';
import { colors, radii, spacing, typography } from '../../theme';

type Props = {
  cities: CityListingCount[];
  onSelectCity?: (cityId: CityId) => void;
};

export function TopCitiesSection({ cities, onSelectCity }: Props) {
  const { t } = useTranslation();

  if (cities.length === 0) return null;

  return (
    <View style={styles.section}>
      <HomeSectionHeader
        title={t('home.topCities')}
        subtitle={t('home.topCitiesSubtitle')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {cities.map(({ cityId, count }) => (
          <Pressable
            key={cityId}
            onPress={() => onSelectCity?.(cityId)}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.chipIcon}>
              <MapPin size={14} color={colors.secondary} strokeWidth={2} />
            </View>
            <View style={styles.chipCopy}>
              <Text style={styles.chipCity} numberOfLines={1}>
                {cityLabel(cityId)}
              </Text>
              <Text style={styles.chipCount}>
                {t('home.listingsCount', { count })}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minWidth: 130,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.secondarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCopy: { gap: 1 },
  chipCity: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '800',
    color: colors.marketplaceTitle,
    maxWidth: 120,
  },
  chipCount: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
