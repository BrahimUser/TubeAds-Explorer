import { useMemo } from 'react';
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
 * - API user profile with `role: "admin"`
 * - Super-admin UID from env (`REACT_APP_SUPER_ADMIN_UID`)
 * - Dev bootstrap: `REACT_APP_ADMIN_UIDS`
 */
export default function useIsAdmin() {
  const { user, userProfile, profileReady } = useAuth();
  const allowed = useMemo(() => uidAllowlist(), []);

  const apiAdmin = profileReady && userProfile?.role === 'admin';
  const isSuper = isSuperAdminUid(user?.uid);

  const isAdmin =
    !!user && (isSuper || allowed.has(user.uid) || apiAdmin);

  const ready =
    !user ||
    allowed.has(user?.uid) ||
    isSuperAdminUid(user?.uid) ||
    profileReady;

  return { isAdmin, ready };
}
