/**
 * App-wide configuration constants.
 *
 * Extracted from the original `App.tsx` (lines 27-58) so that screens and
 * services can import them without going through the root component.
 */

/**
 * YouTube Data API — API key vs OAuth (important for uploads)
 *
 * - Video **upload** (`videos.insert`) uses **OAuth 2.0 only**: the app sends
 *   `Authorization: Bearer <access_token>` from Google Sign-In. You do **not**
 *   put an API key on that request, and you should **not** paste a key into
 *   `uploadVideoToYouTube` in this project.
 * - An **API key** is for **public read** calls (search, list public videos)
 *   where no user login is needed. If you add those features later, create a
 *   key in Google Cloud Console → APIs & Services → Credentials, restrict it
 *   to Android/iOS apps + YouTube Data API v3, and pass it as `key=...` on
 *   GET queries — never ship an unrestricted key in production.
 *
 * Where to configure OAuth for uploads:
 *   Google Cloud Console → APIs & Services → OAuth consent screen +
 *   Credentials → **Web application** client (that id becomes `webClientId`
 *   below via Firebase / same project).
 */

/** OAuth Web Client ID from Google Cloud Console (type: Web application). */
export const GOOGLE_WEB_CLIENT_ID =
  '759606479065-cvug0ve3jg1htg7ktqqcufum3ibsaftf.apps.googleusercontent.com';

/** YouTube category. 22 = "People & Blogs". */
export const YOUTUBE_CATEGORY_ID = '22';

/**
 * Hard cap for video recording duration (seconds).
 *
 * Marketplace listings don't need long videos — keep ads short.
 */
export const MAX_RECORDING_SECONDS = 30;

/**
 * OAuth scopes required so the access token can BOTH upload videos and
 * (optionally) modify playlists. Even though the marketplace flow no longer
 * touches playlists, we keep the full `youtube` scope so the same Google
 * account can still administer the upload destination if you ever want to
 * re-enable playlist insertion.
 *
 * - `youtube.upload` is enough for `videos.insert`.
 * - `youtube`        is the full read/write scope.
 */
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

/** Default currency for new ads. Easy to swap to 'EUR' / 'USD' later. */
export const DEFAULT_CURRENCY = 'MAD' as const;
