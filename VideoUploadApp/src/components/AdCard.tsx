import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryLabel, cityLabel } from '../config/marketplace';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad, Currency } from '../types/Ad';

/**
 * Compact card representation of an `Ad`.
 *
 * Kept around for non-feed contexts (e.g. a future "My ads" screen, a
 * search results list, or anywhere that wants a static thumbnail rather
 * than a playing video). The Home feed uses `VideoFeedItem` instead.
 *
 * Visual style follows the new theme tokens — white surface, brand-color
 * price chip, neutral-gray meta chips for city/category.
 */
function formatPrice(priceCents: number, currency: Currency): string {
  const value = priceCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}

export function AdCard({ ad, onPress }: { ad: Ad; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <Image source={{ uri: ad.thumbnailUrl }} style={styles.thumb} resizeMode="cover" />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {ad.title}
          </Text>
          <View style={styles.priceChip}>
            <Text style={styles.priceText}>{formatPrice(ad.priceCents, ad.currency)}</Text>
          </View>
        </View>
        <Text style={styles.desc} numberOfLines={2}>
          {ad.description}
        </Text>
        {(ad.city || ad.category) && (
          <View style={styles.tagRow}>
            {ad.city ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📍 {cityLabel(ad.city)}</Text>
              </View>
            ) : null}
            {ad.category ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>{categoryLabel(ad.category)}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardPressed: { opacity: 0.85 },
  thumb: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.border,
  },
  body: { padding: spacing.md, gap: spacing.xs + 2 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typography.title, color: colors.text, flex: 1 },
  desc: { ...typography.body, color: colors.textMuted },
  priceChip: {
    backgroundColor: colors.priceTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand,
    ...shadow.priceTag,
  },
  priceText: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  metaChip: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radii.md,
  },
  metaChipText: { ...typography.label, color: colors.text, fontSize: 11 },
});
