import { useEffect, useState } from 'react';
import type { CategoryId } from '../config/marketplace';
import { listenToAds } from '../services/listings';
import type { Ad } from '../types/Ad';

/**
 * Polls approved listings from the Express API.
 */
export function useAds(options?: { category?: CategoryId | null }): {
  ads: Ad[];
  loading: boolean;
  error: Error | null;
  indexBuilding: boolean;
} {
  const category = options?.category ?? null;
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = listenToAds(
      (next) => {
        setAds(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      category ? { category } : undefined,
    );
    return unsub;
  }, [category]);

  return { ads, loading, error, indexBuilding: false };
}
