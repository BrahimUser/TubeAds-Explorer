/**
 * Permanent super-admin (Firebase Auth UID). Full access to `/admin/dashboard` and moderation UI.
 * Override with `REACT_APP_SUPER_ADMIN_UID` in `.env` for deployment-specific UIDs.
 */
const FALLBACK_SUPER_ADMIN_UID = 'hWbzZAQju2Ufbo8iLoaeKBqkA6J3';

export const SUPER_ADMIN_UID =
  typeof process.env.REACT_APP_SUPER_ADMIN_UID === 'string' && process.env.REACT_APP_SUPER_ADMIN_UID.trim()
    ? process.env.REACT_APP_SUPER_ADMIN_UID.trim()
    : FALLBACK_SUPER_ADMIN_UID;

export function isSuperAdminUid(uid) {
  return typeof uid === 'string' && uid.length > 0 && uid === SUPER_ADMIN_UID;
}
