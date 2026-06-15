import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAd } from '../services/listings';
import { queryKeys } from '../queries/keys';

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createAd(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
    meta: { showGlobalLoader: true },
  });
}
