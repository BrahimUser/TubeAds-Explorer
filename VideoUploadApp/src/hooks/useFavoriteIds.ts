import { useEffect, useState } from 'react';
import { fetchFavoriteIds } from '../services/favorites';
import { stringSetsEqual } from '../utils/shallowEqual';
import { createPoller } from './usePolling';

/**
 * Polls favorited ad ids for the signed-in user.
 */
export function useFavoriteIds(
  uid: string | null | undefined,
  options?: { enabled?: boolean },
): {
  ids: Set<string>;
  loading: boolean;
} {
  const enabled = options?.enabled ?? true;
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState<boolean>(uid != null && enabled);

  useEffect(() => {
    if (!uid || !enabled) {
      setIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    return createPoller(
      () => fetchFavoriteIds(),
      (next) => {
        setIds((prev) => (stringSetsEqual(prev, next) ? prev : next));
        setLoading(false);
      },
      () => setLoading(false),
      8000,
    );
  }, [uid, enabled]);

  return { ids, loading };
}
