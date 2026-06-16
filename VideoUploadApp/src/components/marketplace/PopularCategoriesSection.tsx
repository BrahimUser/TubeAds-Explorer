import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2, Car, Home, Laptop } from 'lucide-react-native';
import type { CategoryId } from '../../config/marketplace';
import { POPULAR_CATEGORIES_MOCK, type PopularCategoryMock } from '../../config/marketplaceUi';
import { radii, spacing, typography } from '../../theme';

function BigIcon({ item }: { item: PopularCategoryMock }) {
  const common = { size: 42 as const, strokeWidth: 1.5 as const, color: item.iconColor };
  switch (item.id) {
    case 'vehicles':
      return <Car {...common} />;
    case 'real-estate':
      return <Building2 {...common} />;
    case 'electronics':
      return <Laptop {...common} />;
    case 'home':
      return <Home {...common} />;
    default:
      return <Car {...common} />;
  }
}

type Props = {
  onSelectCategory?: (id: CategoryId) => void;
};

export function PopularCategoriesSection({ onSelectCategory }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{t('sections.popular')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {POPULAR_CATEGORIES_MOCK.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelectCategory?.(item.id)}
            style={[styles.card, { backgroundColor: item.tileBg }]}
          >
            <Text style={styles.cardTitle}>{t(`categories.${item.id}`)}</Text>
            <Text style={styles.cardCount}>
              {t('popularCard.listingsCount', { range: item.countLabel })}
            </Text>
            <View style={styles.iconCorner}>
              <BigIcon item={item} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_W = 156;
const CARD_H = 112;

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  heading: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '800',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    color: '#1A1A2E',
  },
  row: { paddingHorizontal: spacing.lg, gap: spacing.md },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.md,
    padding: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTitle: {
    ...typography.title,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  cardCount: {
    ...typography.caption,
    marginTop: 4,
    color: 'rgba(26,26,46,0.55)',
    fontWeight: '600',
  },
  iconCorner: {
    position: 'absolute',
    end: spacing.sm,
    bottom: spacing.sm,
    opacity: 0.9,
  },
});
