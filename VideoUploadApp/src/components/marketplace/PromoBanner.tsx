import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Sparkles, X } from 'lucide-react-native';
import { colors, radii, shadow, spacing, typography } from '../../theme';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onPublish: () => void;
};

export function PromoBanner({ visible, onDismiss, onPublish }: Props) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.glowA} />
      <View style={styles.glowB} />

      <Pressable
        hitSlop={12}
        style={styles.dismiss}
        onPress={onDismiss}
        accessibilityLabel={t('home.promoDismiss')}
      >
        <X size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
      </Pressable>

      <View style={styles.contentRow}>
        <View style={styles.copy}>
          <View style={styles.badgeRow}>
            <Sparkles size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.badge}>{t('home.promoBadge')}</Text>
          </View>
          <Text style={styles.title}>{t('promo.title')}</Text>
          <Text style={styles.sub}>{t('promo.subtitle')}</Text>
          <Pressable onPress={onPublish} style={styles.cta}>
            <Text style={styles.ctaText}>{t('promo.cta')}</Text>
          </Pressable>
        </View>
        <View style={styles.art}>
          <View style={styles.artInner}>
            <Camera size={32} color="rgba(255,255,255,0.95)" strokeWidth={1.5} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: '#E85D04',
    padding: spacing.lg,
    overflow: 'hidden',
    ...shadow.cta,
  },
  glowA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    end: -20,
  },
  glowB: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: -30,
    start: -10,
  },
  dismiss: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    zIndex: 2,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    marginBottom: 2,
  },
  badge: {
    ...typography.label,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    ...typography.display,
    color: '#FFFFFF',
    fontSize: 20,
    lineHeight: 26,
  },
  sub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  ctaText: {
    ...typography.title,
    fontSize: 13,
    color: colors.marketplaceOrange,
    fontWeight: '800',
  },
  art: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  artInner: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
