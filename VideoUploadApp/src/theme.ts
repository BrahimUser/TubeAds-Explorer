/**
 * Centralized theme tokens for the marketplace app.
 *
 * Aesthetic: **Orange** for commerce CTAs (`Commandez`, primary buttons),
 * **Nile teal** for navigation (tabs, FAB) and contrast; neutral grays for
 * chrome and body text. Soft shadows; orange stays intentional, not overwhelming.
 *
 * EXCEPTIONS — places that intentionally stay dark regardless of theme:
 *   - Video surfaces (`VideoFeedItem` player area) keep dark backgrounds
 *     where appropriate; the marketplace card uses an inset, rounded 16:9 shell.
 */

export const colors = {
  // Surfaces
  bg: '#F8F8F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E8E8EC',
  borderStrong: '#D4D4D8',

  // Text
  text: '#27272A',
  textMuted: '#52525B',
  textDim: '#A1A1AA',

  /** Category tabs & low-emphasis nav chrome (medium gray). */
  tabMuted: '#71717A',

  // Primary orange — CTAs and small highlights (e.g. “PRIX” label)
  brand: '#EA580C',
  brandPressed: '#C2410C',
  brandSubtle: 'rgba(234, 88, 12, 0.12)',

  /** Reference marketplace mockup — vibrant UI orange. */
  marketplaceOrange: '#FF6600',
  marketplaceOrangePressed: '#E65C00',
  /** Header title / deep ink from reference. */
  marketplaceTitle: '#1A1A2E',

  /**
   * Secondary — sophisticated Nile teal for FAB, tab indicator, accents.
   * (Pairs with `slate` for extra depth where needed.)
   */
  secondary: '#0F766E',
  secondaryPressed: '#115E59',
  secondarySubtle: 'rgba(15, 118, 110, 0.14)',

  /** Dark slate blue — optional text/deep contrast. */
  slate: '#334155',

  // Warm accent (sparingly)
  accent: '#FACC15',
  accentPressed: '#EAB308',
  accentSubtle: 'rgba(250, 204, 21, 0.22)',

  /** Soft wash behind price chips (optional; pairs with white). */
  priceTint: '#FFF7ED',

  // Legacy names — map to warm palette for any lingering imports
  marketingInk: '#27272A',
  marketingGold: '#EA580C',
  marketingGoldSoft: '#F97316',

  // Secondary UI accent (links, small highlights)
  link: '#EA580C',

  // Status
  success: '#16A34A',
  successPressed: '#15803D',
  danger: '#DC2626',
  dangerPressed: '#B91C1C',
  warning: '#F59E0B',

  // Overlays
  scrim: 'rgba(0, 0, 0, 0.55)',
  scrimStrong: 'rgba(0, 0, 0, 0.78)',
  whiteAlpha: 'rgba(0, 0, 0, 0.06)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Cards, buttons, and inline chips use 12 for a consistent radius. */
export const radii = {
  sm: 12,
  md: 12,
  lg: 12,
  xl: 12,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
  productTitle: { fontSize: 21, fontWeight: '800' as const, letterSpacing: -0.35 },
  title: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  description: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  caption: { fontSize: 12, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

export const shadow = {
  /** Product cards — neutral, soft. */
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  /** Price chip — very soft teal (orange border stays on the box). */
  priceTag: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  pill: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  pillActive: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Orange CTA — Commandez, primary buttons (#FF6600). */
  cta: {
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
} as const;
