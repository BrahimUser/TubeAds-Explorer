import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

/**
 * Visual variants. Each variant is a complete look — color, pressed
 * state, and disabled state. New variants should be added here so the
 * app stays consistent (don't restyle inline in screens).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

/** Sizes affect padding + label scale, never colour. */
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Shown beside the spinner while `loading` is true (e.g. upload steps). */
  loadingLabel?: string;
  /** Optional style override — only for layout (`flex`, `marginTop`, etc.). */
  style?: StyleProp<ViewStyle>;
  /** Optional adornment rendered to the LEFT of the label. */
  leading?: React.ReactNode;
};

/**
 * The one and only button in the app.
 *
 * Reasons to centralize:
 *   - Pressed/disabled/loading visuals stay consistent (TikTok-y feel).
 *   - One place to swap the press feedback (e.g. add Reanimated scale
 *     bounce later without touching every call site).
 *   - One place to enforce the minimum tap target (44x44 per Apple HIG).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  loadingLabel,
  style,
  leading,
}: Props) {
  const isDisabled = disabled || loading;
  const palette = PALETTES[variant];
  const dims = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? palette.bgPressed : palette.bg,
          borderColor: palette.border,
          borderWidth: palette.borderWidth,
          paddingVertical: dims.paddingVertical,
          paddingHorizontal: dims.paddingHorizontal,
          borderRadius: dims.radius,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator color={palette.label} />
          {loadingLabel ? (
            <Text
              style={[
                styles.label,
                { color: palette.label, fontSize: dims.fontSize },
              ]}
              numberOfLines={2}
            >
              {loadingLabel}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          {leading}
          <Text
            style={[
              styles.label,
              { color: palette.label, fontSize: dims.fontSize },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

type Palette = {
  bg: string;
  bgPressed: string;
  label: string;
  border: string;
  borderWidth: number;
};

const PALETTES: Record<ButtonVariant, Palette> = {
  primary: {
    bg: colors.brand,
    bgPressed: colors.brandPressed,
    label: '#FFFFFF',
    border: 'transparent',
    borderWidth: 0,
  },
  secondary: {
    bg: colors.surfaceElevated,
    bgPressed: colors.brandSubtle,
    label: colors.text,
    border: colors.brand,
    borderWidth: 1,
  },
  success: {
    bg: colors.success,
    bgPressed: colors.successPressed,
    label: '#FFFFFF',
    border: 'transparent',
    borderWidth: 0,
  },
  danger: {
    bg: colors.danger,
    bgPressed: colors.dangerPressed,
    label: '#FFFFFF',
    border: 'transparent',
    borderWidth: 0,
  },
  ghost: {
    bg: 'transparent',
    bgPressed: colors.whiteAlpha,
    label: colors.text,
    border: 'transparent',
    borderWidth: 0,
  },
};

const SIZES: Record<
  ButtonSize,
  { paddingVertical: number; paddingHorizontal: number; radius: number; fontSize: number }
> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, radius: radii.md, fontSize: 13 },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, radius: radii.md, fontSize: 14 },
  lg: { paddingVertical: 16, paddingHorizontal: spacing.xl, radius: radii.md, fontSize: 15 },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  label: { ...typography.title, fontWeight: '700' },
});
