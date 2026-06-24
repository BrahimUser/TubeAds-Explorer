import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '../../theme';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
};

export function MarketplaceSearchBar({ value, onChangeText }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Search size={20} color={colors.textDim} strokeWidth={1.75} />
      <TextInput
        style={styles.input}
        placeholder={t('searchPlaceholder')}
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
      />
      <Pressable hitSlop={10} style={styles.filterBtn} accessibilityLabel={t('home.filters')}>
        <SlidersHorizontal size={20} color={colors.textMuted} strokeWidth={1.75} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: 4,
    color: colors.text,
    fontSize: 15,
  },
  filterBtn: { padding: 4 },
});
