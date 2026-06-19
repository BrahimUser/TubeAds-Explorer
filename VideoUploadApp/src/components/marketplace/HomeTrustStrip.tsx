import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, MessageCircle, Video } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme';

const ITEMS = [
  { key: 'video', Icon: Video, color: colors.marketplaceOrange, bg: colors.brandSubtle },
  { key: 'local', Icon: MapPin, color: colors.secondary, bg: colors.secondarySubtle },
  { key: 'chat', Icon: MessageCircle, color: '#2563EB', bg: '#EFF6FF' },
] as const;

export function HomeTrustStrip() {
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ITEMS.map(({ key, Icon, color, bg }) => (
        <View key={key} style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Icon size={18} color={color} strokeWidth={2} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{t(`home.trust.${key}`)}</Text>
            <Text style={styles.body}>{t(`home.trust.${key}Desc`)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: 220,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '800',
    color: colors.marketplaceTitle,
  },
  body: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
});
