/**
 * Phone + password auth via Express API (replaces Firebase Email/Password).
 */
import api, { mapApiError, setTokens, unwrap } from '../api/client';
import { profileToAppUser, type AppUser } from '../types/AppUser';

/** Build E.164 for Morocco (+212) from local digits (strip leading 0). */
export function buildMoroccoE164(localDigits: string): string | null {
  const digits = String(localDigits || '').replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('0')) national = national.slice(1);
  if (national.startsWith('212')) national = national.slice(3);
  if (national.length < 9) return null;
  return `+212${national.slice(0, 12)}`;
}

export function mapFirebaseAuthError(err: unknown): string {
  return mapApiError(err);
}

export async function registerWithPhonePassword(
  localPhone: string,
  password: string,
): Promise<AppUser> {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const res = await api.post('/auth/register', { phone: localPhone, password });
  const data = unwrap<{
    user: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }>(res);
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return profileToAppUser(data.user);
}

export async function signInWithPhonePassword(
  localPhone: string,
  password: string,
): Promise<AppUser> {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password) throw new Error('Please enter your password.');

  const res = await api.post('/auth/login', { phone: localPhone, password });
  const data = unwrap<{
    user: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }>(res);
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return profileToAppUser(data.user);
}
