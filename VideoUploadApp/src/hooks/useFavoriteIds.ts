import { useEffect, useState } from 'react';
import { listenFavoriteIds } from '../services/favorites';

/**
 * Live set of ad ids favorited by the given user.
 *
 * - When `uid` is `null` (signed out) the hook returns an empty set and
 *   never opens a listener.
 * - The returned `ids` is a stable `Set` reference per snapshot, so
 *   `ids.has(adId)` is O(1) for every card render.
 *
 * Always render the heart icon optimistically; tap handlers should
 * prompt sign-in when `uid` is `null`.
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
    const unsub = listenFavoriteIds(
      uid,
      (next) => {
        setIds(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  return { ids, loading };
}
