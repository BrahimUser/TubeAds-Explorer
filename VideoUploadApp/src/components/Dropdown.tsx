import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

/**
 * One option shown inside the dropdown.
 *
 * `id` is the value persisted (Firestore field, query filter, etc.) —
 * `label` is the user-visible string. Keeping them separate means we can
 * rename or translate labels without rewriting historical data.
 */
export type DropdownOption<T extends string = string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  /** Visible field title above the trigger (e.g. "Category"). */
  label: string;
  /** Currently selected option id, or `null` when nothing is picked yet. */
  value: T | null;
  options: ReadonlyArray<DropdownOption<T>>;
  onChange: (value: T) => void;
  /** Placeholder shown inside the trigger when no value is selected. */
  placeholder?: string;
  disabled?: boolean;
  /** Show a search box at the top of the modal. Defaults to `true` when
   *  `options.length > 8`, off otherwise — pass explicitly to override. */
  searchable?: boolean;
  /** Layout-only style override (e.g. `flex: 1`). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Dropdown / picker built on top of a portal-style `<Modal>` instead of
 * the platform-native picker. We pick a custom modal because:
 *
 *   - The native picker (iOS wheel / Android Spinner) feels out of place
 *     in an Avito-style listing form, where "tap → pick from a tidy
 *     bottom sheet" is the expected interaction.
 *   - We want consistent styling across iOS/Android (search box,
 *     selected check, divider color). The native pickers diverge.
 *   - No extra native dependency — works with the existing toolchain.
 *
 * The list virtualizes via `FlatList`, so adding hundreds of cities
 * later (e.g. neighbourhoods) won't blow up the modal mount cost.
 *
 * Usage:
 *   <Dropdown
 *     label="City"
 *     value={city}
 *     options={CITIES}
 *     onChange={setCity}
 *     placeholder="Select your city"
 *   />
 */
export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled,
  searchable,
  style,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const enableSearch = searchable ?? options.length > 8;

  const filtered = useMemo(() => {
    if (!enableSearch || query.trim().length === 0) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, enableSearch]);

  const selectedLabel = useMemo(() => {
    if (value == null) return null;
    return options.find((o) => o.id === value)?.label ?? null;
  }, [options, value]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} dropdown`}
        accessibilityState={{ disabled: !!disabled, expanded: open }}
        onPress={() => !disabled && setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && !disabled && styles.triggerPressed,
          disabled && styles.triggerDisabled,
        ]}
      >
        <Text
          style={[
            styles.triggerLabel,
            !selectedLabel && styles.triggerPlaceholder,
          ]}
          numberOfLines={1}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        {/* Tap-outside-to-dismiss scrim. */}
        <Pressable style={styles.scrim} onPress={close}>
          {/* Stop propagation: tapping the sheet itself shouldn't close it. */}
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>

            {enableSearch && (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
                placeholderTextColor={colors.textDim}
                style={styles.search}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            )}

            <FlatList
              data={filtered}
              keyExtractor={(o) => o.id}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.divider} />}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matches</Text>
              }
              renderItem={({ item }) => {
                const selected = item.id === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.id);
                      close();
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rowLabel,
                        selected && styles.rowLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selected && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              }}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />

            <Pressable onPress={close} style={styles.cancelBtn}>
              <Text style={styles.cancelLabel}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs + 2,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    minHeight: 44,
  },
  triggerPressed: { borderColor: colors.brand },
  triggerDisabled: { opacity: 0.5 },
  triggerLabel: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  triggerPlaceholder: { color: colors.textDim },
  chevron: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: spacing.sm,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '80%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  list: { flexGrow: 0 },
  listContent: { paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  rowPressed: { backgroundColor: colors.brandSubtle },
  rowLabel: { ...typography.body, color: colors.text, fontSize: 15 },
  rowLabelSelected: { color: colors.brand, fontWeight: '700' },
  check: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
  divider: { height: 1, backgroundColor: colors.border },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  cancelBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelLabel: { ...typography.label, color: colors.textMuted },
});
