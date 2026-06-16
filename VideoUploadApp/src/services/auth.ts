import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Authentication service.
 *
 * Two distinct concerns live here, and the split is intentional:
 *
 *   1. Firebase Auth. Primary sign-in for the app mirrors the website:
 *      phone + password via synthetic email (`phonePasswordAuth.ts`). Email/password
 *      helpers below remain available for edge cases. `signInWithGoogle` is separate
 *      (YouTube upload OAuth).
 *
 *   2. YouTube OAuth token. The bearer token we send to
 *      `googleapis.com/upload/youtube/v3/videos`. This MUST come from
 *      Google Sign-In (YouTube can't be authenticated any other way).
 *      It is produced and cached by `@react-native-google-signin`,
 *      independently of Firebase Auth. An email/password user has a
 *      Firebase identity but NO YouTube token — they'll see the Google
 *      OAuth dialog the first time they publish.
 *
 * Keeping these two flows separate avoids the bug where calling
 * `auth().signInWithCredential(googleCredential)` at publish time
 * silently replaces an email-signed-in user with a Google one.
 */

// ───────────────────────────────────────────────────────────────────
// Firebase Auth: email + password
// ───────────────────────────────────────────────────────────────────

/**
 * Creates a new Firebase Auth user with email + password.
 *
 * Throws on duplicate email, weak password, malformed email, etc.
 * Catch in the caller and surface `(e as Error).message` — Firebase's
 * messages are user-readable enough that we don't need a custom map.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseAuthTypes.User> {
  try {
    const cred = await auth().createUserWithEmailAndPassword(email.trim(), password);
    if (displayName?.trim()) {
      await cred.user.updateProfile({ displayName: displayName.trim() });
    }
    return cred.user;
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Email/password sign-in is turned off in Firebase. Enable it in Firebase Console → Authentication → Sign-in method.',
      );
    }
    if (code === 'auth/invalid-api-key') {
      throw new Error(
        'Firebase API key rejected. Check android/app/google-services.json matches the Android app (package com.videouploadapp2026) in your Firebase project.',
      );
    }
    throw e;
  }
}

/** Signs in an existing email/password Firebase Auth user. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.User> {
  const cred = await auth().signInWithEmailAndPassword(email.trim(), password);
  return cred.user;
}

// ───────────────────────────────────────────────────────────────────
// Firebase Auth: Google bridge
// ───────────────────────────────────────────────────────────────────

/**
 * Signs the user in to Firebase Auth using a Google credential.
 *
 * Side effect: leaves `GoogleSignin` in a signed-in state, so a later
 * call to `getYoutubeAccessToken()` will return immediately without a
 * second OAuth dialog. This is why a Google-signed-up user can publish
 * with no extra prompts.
 */
export async function signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  const idToken = (tokens as { idToken?: string | null }).idToken ?? null;
  if (!idToken) {
    throw new Error(
      'Google Sign-In returned no idToken. Make sure `webClientId` in ' +
        '`GoogleSignin.configure(...)` matches the Web OAuth Client in ' +
        'your Firebase project.',
    );
  }
  const credential = auth.GoogleAuthProvider.credential(idToken);
  const cred = await auth().signInWithCredential(credential);
  return cred.user;
}

// ───────────────────────────────────────────────────────────────────
// YouTube OAuth (independent of Firebase Auth)
// ───────────────────────────────────────────────────────────────────

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
        'Publishing still uses Google to upload to YouTube. In Firebase: register app ' +
        'com.videouploadapp2026, add your debug/release SHA-1, ensure the Web OAuth client ' +
        'matches GOOGLE_WEB_CLIENT_ID, then replace android/app/google-services.json with the ' +
        'file Firebase downloads. Email/password accounts do not trigger this until you publish.',
    );
  }
  throw err instanceof Error ? err : new Error(msg);
}

/**
 * Returns a Google OAuth access token scoped for YouTube uploads.
 *
 * Does NOT touch Firebase Auth. Safe to call when the user is signed
 * in with email/password — their Firebase identity stays intact.
 *
 * If `GoogleSignin` already has a cached session, this returns the
 * existing token. Otherwise the OAuth dialog is shown.
 */
export async function getYoutubeAccessToken(): Promise<string> {
  try {
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

// ───────────────────────────────────────────────────────────────────
// Common helpers
// ───────────────────────────────────────────────────────────────────

/**
 * Returns the currently signed-in Firebase uid, or `null` if there
 * isn't one.
 */
export function getCurrentUid(): string | null {
  return auth().currentUser?.uid ?? null;
}

/**
 * Signs the user out of both Firebase Auth and `GoogleSignin`. Both
 * `.catch` calls swallow per-provider errors so we don't leave the
 * user partially signed-in if one of the two providers throws.
 */
export async function signOut(): Promise<void> {
  await Promise.all([
    auth().signOut().catch(() => undefined),
    GoogleSignin.signOut().catch(() => undefined),
  ]);
}
