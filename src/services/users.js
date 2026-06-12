/**
 * User profiles via Express API.
 */
import api, { unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';

export const USERS_COLLECTION = 'users';

export function normalizeUserProfile(uid, raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      uid,
      isPro: false,
      role: '',
      shopName: '',
      shopLogoUrl: '',
      shopDescription: '',
      phoneNumber: '',
    };
  }
  return {
    uid: raw.id || raw.uid || uid,
    isPro: Boolean(raw.isPro),
    role: String(raw.role ?? '').trim().toLowerCase(),
    shopName: String(raw.shopName ?? raw.shop_name ?? raw.displayName ?? '').trim(),
    shopLogoUrl: String(raw.shopLogoUrl ?? raw.shop_logo_url ?? raw.photoURL ?? '').trim(),
    shopDescription: String(
      raw.shopDescription ?? raw.shop_description ?? raw.bio ?? raw.about ?? '',
    ).trim(),
    phoneNumber: String(raw.phoneNumber ?? raw.phone ?? '').trim(),
  };
}

export function makeEmptyUserProfile(uid) {
  return normalizeUserProfile(uid, null);
}

export async function ensureUserProfileFromPhoneAuth(user) {
  // Profile is created on register; no-op for API auth.
  return user;
}

export async function fetchUser(uid) {
  const res = await api.get(`/users/${uid}`);
  const { user } = unwrap(res);
  return normalizeUserProfile(uid, user);
}

/** Polling replacement for Firestore onSnapshot on users/{uid}. */
export function subscribeUser(uid, onChange, onError) {
  if (!uid) {
    onChange(normalizeUserProfile('', null));
    return () => {};
  }
  return createPoller(
    () => fetchUser(uid),
    onChange,
    onError,
    10000,
  );
}
