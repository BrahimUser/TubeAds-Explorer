import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveListing, rejectListing } from '../services/listings';
import { queryKeys } from '../queries/keys';

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId) => approveListing(adId),
    onSuccess: (_data, adId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.removeQueries({ queryKey: queryKeys.listings.detail(adId) });
    },
    meta: { showGlobalLoader: true },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId) => rejectListing(adId),
    onSuccess: (_data, adId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.removeQueries({ queryKey: queryKeys.listings.detail(adId) });
    },
    meta: { showGlobalLoader: true },
  });
}
