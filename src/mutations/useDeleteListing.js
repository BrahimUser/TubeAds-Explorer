import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAd } from '../services/listings';
import { queryKeys } from '../queries/keys';

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId) => deleteAd(adId),
    onSuccess: (_data, adId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.removeQueries({ queryKey: queryKeys.listings.detail(adId) });
    },
    meta: { showGlobalLoader: true },
  });
}
