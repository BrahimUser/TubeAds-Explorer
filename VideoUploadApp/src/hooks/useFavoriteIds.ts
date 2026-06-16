import { useEffect, useState } from 'react';
import { fetchFavoriteIds } from '../services/favorites';
import { createPoller } from './usePolling';

/**
 * Polls favorited ad ids for the signed-in user.
 */
export function useFavoriteIds(uid: string | null | undefined): {
  ids: Set<string>;
  loading: boolean;
} {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState<boolean>(uid != null);

  useEffect(() => {
    if (!uid) {
      setIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    return createPoller(
      () => fetchFavoriteIds(),
      (next) => {
        setIds(next);
        setLoading(false);
      },
      () => setLoading(false),
      8000,
    );
  }, [uid]);

  return { ids, loading };
}
