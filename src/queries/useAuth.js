import { useQuery } from '@tanstack/react-query';
import api, { clearTokens, getAccessToken, silentRequest, unwrap } from '../api/client';
import { queryKeys } from './keys';

function toAuthUser(profile) {
  if (!profile) return null;
  return {
    uid: profile.id || profile.uid,
    id: profile.id || profile.uid,
    phoneNumber: profile.phoneNumber,
    displayName: profile.displayName || profile.phoneNumber,
    email: null,
  };
}

function toUserProfile(profile) {
  if (!profile) return null;
  return {
    uid: profile.id,
    isPro: profile.isPro,
    role: String(profile.role || '').toLowerCase(),
    shopName: profile.shopName || '',
    shopLogoUrl: profile.shopLogoUrl || '',
    shopDescription: profile.shopDescription || '',
    phoneNumber: profile.phoneNumber || '',
  };
}

async function fetchAuthMe() {
  const token = getAccessToken();
  if (!token) return { user: null, profile: null };
  const res = await api.get('/auth/me', silentRequest);
  const { user: profile } = unwrap(res);
  return { user: toAuthUser(profile), profile: toUserProfile(profile) };
}

/** Current authenticated session from GET /auth/me. */
export function useAuthMe({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchAuthMe,
    enabled,
    staleTime: 60 * 1000,
    retry: false,
    meta: { showGlobalLoader: false },
  });
}

export { toAuthUser, toUserProfile, fetchAuthMe };

export function invalidateAuthSession(queryClient) {
  queryClient.removeQueries({ queryKey: queryKeys.auth.all });
}

export function clearAuthAndCache(queryClient) {
  clearTokens();
  invalidateAuthSession(queryClient);
}
