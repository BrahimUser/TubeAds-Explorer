import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSuperAdminUid } from '../constants/superAdmin';

function uidAllowlist() {
  const raw = typeof process.env.REACT_APP_ADMIN_UIDS === 'string' ? process.env.REACT_APP_ADMIN_UIDS : '';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Admin access for moderation UI:
 * - Permanent super-admin UID (`constants/superAdmin.js`)
 * - Firestore `users/{uid}` with `role: "admin"` (synced via AuthContext)
 * - Firebase Auth custom claim `{ admin: true }`
 * - Dev / bootstrap: comma-separated Firebase Auth UIDs in `REACT_APP_ADMIN_UIDS`
 */
export default function useIsAdmin() {
  const { user, userProfile, profileReady } = useAuth();
  const allowed = useMemo(() => uidAllowlist(), []);
  const [claimsAdmin, setClaimsAdmin] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setClaimsAdmin(false);
      setTokenReady(true);
      return undefined;
    }

    if (allowed.has(user.uid) || isSuperAdminUid(user.uid)) {
      setClaimsAdmin(false);
      setTokenReady(true);
      return undefined;
    }

    setTokenReady(false);
    (async () => {
      try {
        const r = await user.getIdTokenResult(true);
        if (!cancelled) setClaimsAdmin(!!r?.claims?.admin);
      } catch {
        if (!cancelled) setClaimsAdmin(false);
      } finally {
        if (!cancelled) setTokenReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, allowed]);

  const firestoreAdmin = profileReady && userProfile?.role === 'admin';
  const isSuper = isSuperAdminUid(user?.uid);

  const isAdmin =
    !!user && (isSuper || allowed.has(user.uid) || claimsAdmin || firestoreAdmin);

  const ready =
    !user ||
    allowed.has(user?.uid) ||
    isSuperAdminUid(user?.uid) ||
    (profileReady && tokenReady);

  return { isAdmin, ready };
}
