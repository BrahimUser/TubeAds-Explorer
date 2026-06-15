import { useQuery } from '@tanstack/react-query';
import { REFETCH_INTERVAL } from '../api/queryClient';
import { fetchFavoriteIds } from '../services/favorites';
import { queryKeys } from './keys';

/** Set of favorited listing ids for the signed-in user. */
export function useFavoriteIds(uid, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.favorites.ids(uid),
    queryFn: () => fetchFavoriteIds(),
    enabled: enabled && !!uid,
    refetchInterval: REFETCH_INTERVAL.favorites,
    placeholderData: new Set(),
    select: (data) => data ?? new Set(),
  });
}
