import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '../services/favorites';
import { queryKeys } from '../queries/keys';

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ad, currentlyFavorited }) => {
      if (currentlyFavorited) {
        await removeFavorite(ad.id);
        return { adId: ad.id, favorited: false };
      }
      await addFavorite(ad);
      return { adId: ad.id, favorited: true };
    },
    onMutate: async ({ ad, currentlyFavorited, uid }) => {
      if (!uid) return {};
      const key = queryKeys.favorites.ids(uid);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (prev) => {
        const ids = prev instanceof Set ? new Set(prev) : new Set(prev || []);
        if (currentlyFavorited) ids.delete(ad.id);
        else ids.add(ad.id);
        return ids;
      });
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { uid }) => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites.ids(uid) });
        queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(uid) });
      }
    },
    meta: { showGlobalLoader: false },
  });
}
