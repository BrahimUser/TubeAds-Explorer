import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAd } from '../services/listings';
import { queryKeys } from '../queries/keys';

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, patch }) => updateAd(adId, patch),
    onSuccess: (_data, { adId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(adId) });
    },
    meta: { showGlobalLoader: true },
  });
}
