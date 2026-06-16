import { useEffect, useRef, useState } from 'react';
import type { CategoryId } from '../config/marketplace';
import { isFirestoreIndexBuildingError, listenToAds } from '../services/firestore';
import type { Ad } from '../types/Ad';

const INDEX_RETRY_MS = 3000;
/** When we never hit an index error, stop blocking the UI if only cached/offline data arrives. */
const OFFLINE_CACHE_FALLBACK_MS = 45_000;

/**
 * Subscribes to approved listings from Firestore (`status === 'approved'`),
 * matching the public website feed — when an admin approves on the web, the
 * mobile home list updates in real time via `onSnapshot`.
 *
 * Drop-in for any screen that needs a live list:
 *
 *   const { ads, loading, error } = useAds();
 *   const { ads } = useAds({ category: 'electronics' });
 *
 * Pass `category` to filter at the query level (cheaper than fetching
 * everything and filtering in JS). Passing `null` / `undefined` returns
 * all categories — no `where('category', …)` clause. The hook
 * auto-detaches its listener on unmount, and re-subscribes whenever the
 * filter changes.
 *
 * **Loading** stays **true** until a snapshot is confirmed from the
 * **server** (`!metadata.fromCache`), so the spinner keeps running while
 * Firebase finishes building a new composite index. If the SDK reports a
 * missing index, **`indexBuilding`** is set and the listener retries every
 * few seconds until the console index shows **Enabled** and the query
 * succeeds — with **no** cache fallback during that period so the feed
 * does not flash stale data.
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
  const [indexBuilding, setIndexBuilding] = useState(false);
  const sawIndexErrorRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let offlineFallbackTimer: ReturnType<typeof setTimeout> | undefined;

    sawIndexErrorRef.current = false;

    const clearOfflineFallback = () => {
      if (offlineFallbackTimer !== undefined) {
        clearTimeout(offlineFallbackTimer);
        offlineFallbackTimer = undefined;
      }
    };

    const armOfflineFallbackIfAllowed = () => {
      clearOfflineFallback();
      offlineFallbackTimer = setTimeout(() => {
        offlineFallbackTimer = undefined;
        if (cancelled || sawIndexErrorRef.current) return;
        setLoading(false);
        setIndexBuilding(false);
      }, OFFLINE_CACHE_FALLBACK_MS);
    };

    const start = () => {
      unsub?.();
      setLoading(true);
      setError(null);
      if (!sawIndexErrorRef.current) {
        armOfflineFallbackIfAllowed();
      }
      unsub = listenToAds(
        (next, meta) => {
          if (cancelled) return;
          setAds(next);
          if (meta.isFromServer) {
            clearOfflineFallback();
            setLoading(false);
            setError(null);
            setIndexBuilding(false);
            sawIndexErrorRef.current = false;
          }
        },
        (err) => {
          if (cancelled) return;
          if (isFirestoreIndexBuildingError(err)) {
            sawIndexErrorRef.current = true;
            clearOfflineFallback();
            setIndexBuilding(true);
            setLoading(true);
            setError(null);
            if (retryTimer !== undefined) clearTimeout(retryTimer);
            retryTimer = setTimeout(() => {
              retryTimer = undefined;
              if (!cancelled) start();
            }, INDEX_RETRY_MS);
          } else {
            setIndexBuilding(false);
            setError(err as Error);
            setLoading(false);
            clearOfflineFallback();
          }
        },
        category ? { category } : undefined,
      );
    };

    start();

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) clearTimeout(retryTimer);
      clearOfflineFallback();
      unsub?.();
    };
  }, [category]);

  return { ads, loading, error, indexBuilding };
}
