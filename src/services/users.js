/**
 * User profiles via Express API.
 */
import api, { silentRequest, unwrap } from '../api/client';

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

export async function fetchUser(uid, requestConfig = silentRequest) {
  const res = await api.get(`/users/${uid}`, requestConfig);
  const { user } = unwrap(res);
  return normalizeUserProfile(uid, user);
}
