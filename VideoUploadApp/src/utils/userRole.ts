/**
 * Firestore user docs may store admin as `role: "admin"` / `Role`, or `isAdmin: true`.
 * Matches the spirit of `marketplace-web` `normalizeUserProfile`.
 */
export function parseIsAdminFromUserDoc(raw: Record<string, unknown> | null | undefined): boolean {
  if (!raw || typeof raw !== 'object') return false;
  if (raw.isAdmin === true) return true;
  const r = String((raw as { role?: unknown }).role ?? (raw as { userRole?: unknown }).userRole ?? '')
    .trim()
    .toLowerCase();
  return r === 'admin';
}

export function roleLabelFromUserDoc(raw: Record<string, unknown> | null | undefined): string {
  if (!raw || typeof raw !== 'object') return '';
  return String((raw as { role?: unknown }).role ?? '').trim();
}
