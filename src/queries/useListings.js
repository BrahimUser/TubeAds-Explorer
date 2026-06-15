import { useQuery } from '@tanstack/react-query';
import { REFETCH_INTERVAL } from '../api/queryClient';
import { fetchListings, getAd } from '../services/listings';
import { queryKeys } from './keys';

function timestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts === 'string') return new Date(ts).getTime();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  return 0;
}

function sortByCreatedAt(items) {
  return [...items].sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));
}

/** Approved listings for the public marketplace. */
export function useApprovedListings({ max = 120, enabled = true } = {}) {
  const filters = { status: 'approved', limit: max };
  return useQuery({
    queryKey: queryKeys.listings.list(filters),
    queryFn: async () => {
      const items = await fetchListings(filters);
      return sortByCreatedAt(items).slice(0, max);
    },
    enabled,
    refetchInterval: REFETCH_INTERVAL.listings,
  });
}

/** Pending listings for admin moderation queue. */
export function usePendingListings({ enabled = true } = {}) {
  const filters = { status: 'pending', limit: 100 };
  return useQuery({
    queryKey: queryKeys.listings.list(filters),
    queryFn: async () => {
      const items = await fetchListings(filters);
      return sortByCreatedAt(items);
    },
    enabled,
    refetchInterval: REFETCH_INTERVAL.listings,
  });
}

/** All listings owned by a specific user. */
export function useOwnerListings(ownerUid, { enabled = true } = {}) {
  const filters = { ownerId: ownerUid, limit: 100 };
  return useQuery({
    queryKey: queryKeys.listings.list(filters),
    queryFn: async () => {
      if (!ownerUid) return [];
      const items = await fetchListings(filters);
      return sortByCreatedAt(items);
    },
    enabled: enabled && !!ownerUid,
    refetchInterval: REFETCH_INTERVAL.listings,
  });
}

/** Single listing by id. */
export function useListing(listingId, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.listings.detail(listingId),
    queryFn: () => getAd(listingId),
    enabled: enabled && !!listingId,
  });
}
