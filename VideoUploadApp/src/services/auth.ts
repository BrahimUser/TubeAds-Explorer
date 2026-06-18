import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api, { clearTokens, getRefreshToken } from '../api/client';
import { GOOGLE_WEB_CLIENT_ID, YOUTUBE_SCOPES } from '../config/constants';
import { notifyAuthSignedOut } from '../types/AppUser';
import { disconnectSocket } from './socket';

let googleSignInConfigured = false;

export function ensureGoogleSignInConfigured(): void {
  if (googleSignInConfigured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: false,
    scopes: YOUTUBE_SCOPES,
  });
  googleSignInConfigured = true;
}

/**
 * YouTube OAuth token for video uploads — independent of app authentication.
 */

function wrapGoogleSignInConfigError(err: unknown): never {
  const msg = String((err as Error)?.message ?? err);
  const code = (err as { code?: string })?.code;
  const looksLikeDeveloperError =
    msg.includes('DEVELOPER_ERROR') ||
    msg.includes('ApiException: 10') ||
    code === '10';
  if (looksLikeDeveloperError) {
    throw new Error(
      'Google Sign-In failed (DEVELOPER_ERROR): Android OAuth is misconfigured. ' +
        'Publishing uses Google to upload to YouTube. Ensure the Web OAuth client ' +
        'matches GOOGLE_WEB_CLIENT_ID and your app SHA-1 is registered in Google Cloud.',
    );
  }
  throw err instanceof Error ? err : new Error(msg);
}

/** Returns a Google OAuth access token scoped for YouTube uploads. */
export async function getYoutubeAccessToken(): Promise<string> {
  try {
    ensureGoogleSignInConfigured();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const current = GoogleSignin.getCurrentUser();
    if (!current) {
      await GoogleSignin.signIn();
    }

    const tokens = await GoogleSignin.getTokens();
    if (!tokens.accessToken) {
      throw new Error('Google Sign-In returned no accessToken for YouTube.');
    }
    return tokens.accessToken;
  } catch (e) {
    wrapGoogleSignInConfigError(e);
  }
}

/** Signs out of the API session and Google Sign-In (YouTube). */
export async function signOut(): Promise<void> {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
  } finally {
    await clearTokens();
    disconnectSocket();
    notifyAuthSignedOut();
    await GoogleSignin.signOut().catch(() => undefined);
  }
}
