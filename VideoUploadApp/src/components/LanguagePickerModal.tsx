import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../localization';
import { setAppLanguage } from '../localization';
import { colors, radii, spacing, typography } from '../theme';

const OPTIONS: { code: AppLanguage; flag: string; labelKey: 'english' | 'arabic' | 'french' }[] = [
  { code: 'en', flag: '🇺🇸', labelKey: 'english' },
  { code: 'ar', flag: '🇸🇦', labelKey: 'arabic' },
  { code: 'fr', flag: '🇫🇷', labelKey: 'french' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LanguagePickerModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const current = (i18n.language?.split('-')[0] ?? 'en') as AppLanguage;
  const normalized: AppLanguage =
    current === 'ar' || current === 'fr' || current === 'en' ? current : 'en';

  const select = async (code: AppLanguage) => {
    if (code === normalized) {
      onClose();
      return;
    }
    await setAppLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('language.title')}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
            >
              <X size={22} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          {OPTIONS.map((row) => {
            const selected = row.code === normalized;
            return (
              <Pressable
                key={row.code}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.88 }]}
                onPress={() => select(row.code)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.flag}>{row.flag}</Text>
                <Text style={styles.langName}>{t(`language.${row.labelKey}`)}</Text>
                {selected ? (
                  <Check size={22} color={colors.marketplaceOrange} strokeWidth={2.5} />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )}
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingTop: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '800',
    color: colors.marketplaceTitle,
  },
  closeBtn: { padding: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  flag: { fontSize: 28, lineHeight: 34 },
  langName: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  checkPlaceholder: { width: 22, height: 22 },
});
