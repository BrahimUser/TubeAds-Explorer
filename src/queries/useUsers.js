import { useQueries, useQuery } from '@tanstack/react-query';
import { REFETCH_INTERVAL, STALE_TIME } from '../api/queryClient';
import { fetchUser, makeEmptyUserProfile, normalizeUserProfile } from '../services/users';
import { queryKeys } from './keys';

/** Single user profile by uid. */
export function useUser(uid, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.users.detail(uid),
    queryFn: () => fetchUser(uid),
    enabled: enabled && !!uid,
    staleTime: STALE_TIME.user,
    refetchInterval: REFETCH_INTERVAL.users,
    placeholderData: uid ? makeEmptyUserProfile(uid) : undefined,
  });
}

/** Batch-fetch seller profiles for card grids (deduplicated via query cache). */
export function useSellerProfiles(memberUids) {
  const uids = [...new Set((memberUids || []).filter(Boolean))];

  const results = useQueries({
    queries: uids.map((uid) => ({
      queryKey: queryKeys.users.detail(uid),
      queryFn: async () => {
        try {
          return await fetchUser(uid);
        } catch {
          return normalizeUserProfile(uid, null);
        }
      },
      staleTime: STALE_TIME.user,
      enabled: !!uid,
    })),
  });

  const profiles = {};
  uids.forEach((uid, i) => {
    profiles[uid] = results[i]?.data ?? normalizeUserProfile(uid, null);
  });
  return profiles;
}
