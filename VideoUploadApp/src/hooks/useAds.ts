import { useEffect, useState } from 'react';
import type { CategoryId } from '../config/marketplace';
import { listenToAds } from '../services/listings';
import { mapApiError } from '../api/client';
import type { Ad } from '../types/Ad';
import { adsArraysEqual } from '../utils/shallowEqual';

/**
 * Polls approved listings from the Express API.
 */
export function useAds(options?: {
  category?: CategoryId | null;
  enabled?: boolean;
}): {
  ads: Ad[];
  loading: boolean;
  error: Error | null;
  indexBuilding: boolean;
} {
  const category = options?.category ?? null;
  const enabled = options?.enabled ?? true;
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    setLoading(true);
    setError(null);
    const unsub = listenToAds(
      (next) => {
        setAds((prev) => (adsArraysEqual(prev, next) ? prev : next));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(new Error(mapApiError(err)));
        setLoading(false);
      },
      category ? { category } : undefined,
    );
    return unsub;
  }, [category, enabled]);

  return { ads, loading, error, indexBuilding: false };
}
