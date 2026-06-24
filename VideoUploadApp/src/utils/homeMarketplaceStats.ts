import { CATEGORIES, type CategoryId, type CityId } from '../config/marketplace';
import type { Ad } from '../types/Ad';
import { apiDateToMs } from './apiMappers';

export type HomeMarketplaceStats = {
  totalListings: number;
  newThisWeek: number;
  activeCities: number;
  activeCategories: number;
};

export type CityListingCount = {
  cityId: CityId;
  count: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function resolveCategoryId(stored: string): CategoryId | null {
  const byId = CATEGORIES.find((c) => c.id === stored);
  if (byId) return byId.id;
  const byLabel = CATEGORIES.find((c) => c.label === stored);
  if (byLabel) return byLabel.id;
  return null;
}

export function computeHomeStats(ads: Ad[]): HomeMarketplaceStats {
  const now = Date.now();
  const cities = new Set<CityId>();
  const categories = new Set<CategoryId>();
  let newThisWeek = 0;

  for (const ad of ads) {
    cities.add(ad.city);
    const catId = resolveCategoryId(ad.category);
    if (catId) categories.add(catId);

    const ms = apiDateToMs(ad.createdAt);
    if (ms != null && now - ms < WEEK_MS) newThisWeek += 1;
  }

  return {
    totalListings: ads.length,
    newThisWeek,
    activeCities: cities.size,
    activeCategories: categories.size,
  };
}

export function computeCategoryCounts(ads: Ad[]): Partial<Record<CategoryId, number>> {
  const counts: Partial<Record<CategoryId, number>> = {};
  for (const ad of ads) {
    const catId = resolveCategoryId(ad.category);
    if (!catId) continue;
    counts[catId] = (counts[catId] ?? 0) + 1;
  }
  return counts;
}

export function computeTopCities(ads: Ad[], limit = 6): CityListingCount[] {
  const tally = new Map<CityId, number>();
  for (const ad of ads) {
    tally.set(ad.city, (tally.get(ad.city) ?? 0) + 1);
  }
  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cityId, count]) => ({ cityId, count }));
}
