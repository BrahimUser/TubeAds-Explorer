/**
 * Visual tokens for the Home marketplace layout.
 * Copy lives in locale JSON files (`src/locales`) via i18next.
 *
 * Category **Firestore values** and `CategoryId` live in `marketplace.ts`.
 */

import type { CategoryId } from './marketplace';

/** Row order for top chips (reference design order first, then rest). */
export const CATEGORY_CHIP_ORDER: CategoryId[] = [
  'vehicles',
  'real-estate',
  'electronics',
  'home',
  'fashion',
  'rugs',
  'jobs',
  'services',
  'other',
];

export type CategoryVisual = {
  iconBg: string;
  iconColor: string;
};

/** Unselected square: light tile + colored icon (reference aesthetic). */
export const CATEGORY_VISUAL: Record<CategoryId, CategoryVisual> = {
  vehicles: { iconBg: '#EFF6FF', iconColor: '#2563EB' },
  'real-estate': { iconBg: '#ECFDF5', iconColor: '#16A34A' },
  electronics: { iconBg: '#F3E8FF', iconColor: '#9333EA' },
  home: { iconBg: '#FEF2F2', iconColor: '#DC2626' },
  fashion: { iconBg: '#FDF2F8', iconColor: '#DB2777' },
  rugs: { iconBg: '#FFF7ED', iconColor: '#EA580C' },
  jobs: { iconBg: '#F8FAFC', iconColor: '#475569' },
  services: { iconBg: '#FFFBEB', iconColor: '#CA8A04' },
  other: { iconBg: '#F4F4F5', iconColor: '#71717A' },
};

export type PopularCategoryMock = {
  id: CategoryId;
  countLabel: string;
  tileBg: string;
  iconColor: string;
};

export const POPULAR_CATEGORIES_MOCK: PopularCategoryMock[] = [
  {
    id: 'vehicles',
    countLabel: '12k+',
    tileBg: '#E0F2FE',
    iconColor: '#0284C7',
  },
  {
    id: 'real-estate',
    countLabel: '8k+',
    tileBg: '#DCFCE7',
    iconColor: '#16A34A',
  },
  {
    id: 'electronics',
    countLabel: '15k+',
    tileBg: '#F3E8FF',
    iconColor: '#9333EA',
  },
  {
    id: 'home',
    countLabel: '6k+',
    tileBg: '#FFE4E6',
    iconColor: '#E11D48',
  },
];
