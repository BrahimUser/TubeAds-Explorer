/**
 * Super-admin user id (UUID from Express API seed).
 * Override with `REACT_APP_SUPER_ADMIN_UID` after seeding.
 */
const FALLBACK_SUPER_ADMIN_UID = '';

export const SUPER_ADMIN_UID =
  typeof process.env.REACT_APP_SUPER_ADMIN_UID === 'string' && process.env.REACT_APP_SUPER_ADMIN_UID.trim()
    ? process.env.REACT_APP_SUPER_ADMIN_UID.trim()
    : FALLBACK_SUPER_ADMIN_UID;

export function isSuperAdminUid(uid) {
  if (!SUPER_ADMIN_UID) return false;
  return typeof uid === 'string' && uid.length > 0 && uid === SUPER_ADMIN_UID;
}
