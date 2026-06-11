import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { USERS_COLLECTION, normalizeUserProfile } from '../services/users';

/**
 * One-off fetch of seller profiles for cards (not real-time per profile).
 * Uids list should be stable-ish (deduped) to avoid extra reads.
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
            const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
            if (!snap.exists()) return [uid, normalizeUserProfile(uid, null)];
            return [uid, normalizeUserProfile(uid, snap.data())];
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
