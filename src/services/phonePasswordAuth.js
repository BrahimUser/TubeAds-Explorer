/**
 * Phone + password auth via Express API (replaces Firebase Email/Password).
 */
import api, { setTokens, mapApiError, unwrap } from '../api/client';

/** Build E.164 for Morocco (+212) from local digits (strip leading 0). */
export function buildMoroccoE164(localDigits) {
  const digits = String(localDigits || '').replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('0')) national = national.slice(1);
  if (national.startsWith('212')) national = national.slice(3);
  if (national.length < 9) return null;
  return `+212${national.slice(0, 12)}`;
}

export function mapFirebaseAuthError(err) {
  return mapApiError(err);
}

/**
 * Register with phone + password.
 * @returns {{ uid: string, id: string, phoneNumber: string, ... }}
 */
export async function registerWithPhonePassword(localPhone, password) {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const res = await api.post('/auth/register', { phone: localPhone, password });
  const data = unwrap(res);
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return toAuthUser(data.user);
}

/**
 * Sign in with phone + password.
 */
export async function signInWithPhonePassword(localPhone, password) {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password) throw new Error('Please enter your password.');

  const res = await api.post('/auth/login', { phone: localPhone, password });
  const data = unwrap(res);
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return toAuthUser(data.user);
}

/** Shape compatible with components expecting Firebase User fields. */
function toAuthUser(profile) {
  return {
    uid: profile.id || profile.uid,
    id: profile.id || profile.uid,
    phoneNumber: profile.phoneNumber,
    displayName: profile.displayName || profile.phoneNumber,
    email: null,
  };
}
