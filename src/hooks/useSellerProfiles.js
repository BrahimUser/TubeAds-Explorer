import { useEffect, useState } from 'react';
import { fetchUser, normalizeUserProfile } from '../services/users';

/**
 * One-off fetch of seller profiles for cards (not real-time per profile).
 */
export function useSellerProfiles(memberUids) {
  const [profiles, setProfiles] = useState(() => ({}));
  const key = [...new Set((memberUids || []).filter(Boolean))].sort().join(',');

  useEffect(() => {
    if (!key) {
      setProfiles({});
      return undefined;
    }
    const uids = key.split(',');
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        uids.map(async (uid) => {
          try {
            const profile = await fetchUser(uid);
            return [uid, profile];
          } catch {
            return [uid, normalizeUserProfile(uid, null)];
          }
        }),
      );
      if (!cancelled) setProfiles(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return profiles;
}
