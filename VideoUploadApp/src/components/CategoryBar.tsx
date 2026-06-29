import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Armchair,
  Briefcase,
  Building2,
  Car,
  CircleHelp,
  LampDesk,
  LayoutGrid,
  Layers,
  Shirt,
  Sprout,
  Wrench,
  type LucideIcon,
} from 'lucide-react-native';
import { CATEGORIES, CATEGORY_ALL_LABEL, type CategoryId } from '../config/marketplace';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = {
  /** `null` means "All". */
  value: CategoryId | null;
  onChange: (next: CategoryId | null) => void;
  /** Layout-only style override (margin, position, etc.). */
  style?: StyleProp<ViewStyle>;
  /**
   * `'surface'` — light pills on white (under chrome). Default for feeds.
   * `'overlay'` — translucent pills on dark media (legacy Reels overlay).
   */
  variant?: 'overlay' | 'surface';
};

function iconForCategory(id: CategoryId | null): LucideIcon {
  if (id === null) return LayoutGrid;
  const m: Record<CategoryId, LucideIcon> = {
    agriculture: Sprout,
    rugs: Layers,
    electronics: LampDesk,
    vehicles: Car,
    'real-estate': Building2,
    fashion: Shirt,
    home: Armchair,
    jobs: Briefcase,
    services: Wrench,
    other: CircleHelp,
  };
  return m[id] ?? CircleHelp;
}

type Palette = {
  bg: string;
  bgActive: string;
  border: string;
  bottomIndicator: string;
  text: string;
  textActive: string;
};

/** Unselected: medium gray icons + labels. Selected: white/light surface + teal underline (not orange fill). */
const surfacePalette: Palette = {
  bg: colors.bg,
  bgActive: colors.surfaceElevated,
  border: colors.border,
  bottomIndicator: colors.secondary,
  text: colors.tabMuted,
  textActive: colors.text,
};

const overlayPalette: Palette = {
  bg: 'rgba(255, 255, 255, 0.08)',
  bgActive: 'rgba(255, 255, 255, 0.14)',
  border: 'rgba(255, 255, 255, 0.22)',
  bottomIndicator: colors.secondary,
  text: 'rgba(255, 255, 255, 0.62)',
  textActive: '#FFFFFF',
};

/**
 * Horizontal category strip with Lucide icons and elevated pill shapes.
 */
export function CategoryBar({ value, onChange, style, variant = 'surface' }: Props) {
  const isOverlay = variant === 'overlay';
  const palette = isOverlay ? overlayPalette : surfacePalette;

  return (
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pill
          label={CATEGORY_ALL_LABEL}
          Icon={iconForCategory(null)}
          active={value === null}
          onPress={() => onChange(null)}
          palette={palette}
          variant={variant}
        />
        {CATEGORIES.map((c) => (
          <Pill
            key={c.id}
            label={c.label}
            Icon={iconForCategory(c.id)}
            active={value === c.id}
            onPress={() => onChange(c.id)}
            palette={palette}
            variant={variant}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Pill({
  label,
  Icon,
  active,
  onPress,
  palette,
  variant,
}: {
  label: string;
  Icon: LucideIcon;
  active: boolean;
  onPress: () => void;
  palette: Palette;
  variant: 'overlay' | 'surface';
}) {
  const iconColor = active ? palette.textActive : palette.text;
  const shadowStyle =
    variant === 'surface' && active && Platform.OS === 'ios'
      ? shadow.pillActive
      : variant === 'surface' && active
        ? { elevation: shadow.pillActive.elevation }
        : variant === 'surface' && !active && Platform.OS === 'ios'
          ? shadow.pill
          : variant === 'surface' && !active
            ? { elevation: shadow.pill.elevation }
            : {};

  const borderStyles = active
    ? {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 2,
        borderTopColor: palette.border,
        borderLeftColor: palette.border,
        borderRightColor: palette.border,
        borderBottomColor: palette.bottomIndicator,
      }
    : {
        borderWidth: 1,
        borderColor: palette.border,
      };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        shadowStyle,
        {
          backgroundColor: active ? palette.bgActive : palette.bg,
        },
        borderStyles,
        pressed && styles.pillPressed,
      ]}
    >
      <Icon size={18} color={iconColor} strokeWidth={1.75} />
      <Text
        style={[
          styles.pillLabel,
          {
            color: active ? palette.textActive : palette.text,
            fontWeight: active ? '700' : '600',
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  pillPressed: { opacity: 0.82 },
  pillLabel: { ...typography.label, fontSize: 13, letterSpacing: 0.2 },
});
