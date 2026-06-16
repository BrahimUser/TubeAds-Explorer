import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onPublish: () => void;
};

/**
 * Orange promo strip from reference — text + CTA. Graphic is optional;
 * uses a lightweight pattern so we don't ship binary art assets.
 */
export function PromoBanner({ visible, onDismiss, onPublish }: Props) {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <View style={styles.wrap}>
      <Pressable
        hitSlop={12}
        style={styles.dismiss}
        onPress={onDismiss}
        accessibilityLabel={t('home.promoDismiss')}
      >
        <X size={20} color="#FFFFFF" strokeWidth={2} />
      </Pressable>
      <View style={styles.contentRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>{t('promo.title')}</Text>
          <Text style={styles.sub}>{t('promo.subtitle')}</Text>
          <Pressable onPress={onPublish} style={styles.cta}>
            <Text style={styles.ctaText}>{t('promo.cta')}</Text>
          </Pressable>
        </View>
        <View style={styles.art}>
          <View style={styles.boxArt} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.marketplaceOrange,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  dismiss: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    zIndex: 2,
    padding: 4,
  },
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.sm },
  title: {
    ...typography.display,
    color: '#FFFFFF',
    fontSize: 20,
  },
  sub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    marginTop: spacing.xs,
  },
  ctaText: {
    ...typography.title,
    fontSize: 14,
    color: colors.marketplaceOrange,
    fontWeight: '800',
  },
  art: { width: 88, height: 88, justifyContent: 'center', alignItems: 'center' },
  boxArt: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
