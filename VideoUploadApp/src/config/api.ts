import { Platform } from 'react-native';

/**
 * Express API base URL.
 *
 * - Android emulator: 10.0.2.2 maps to the host machine
 * - iOS simulator: localhost maps to the host machine
 * - Physical device (USB): localhost + `npm run android:reverse` (default)
 * - Physical device (Wi‑Fi only): set USE_ADB_REVERSE to false and update
 *   DEV_MACHINE_HOST to your PC LAN IP (`hostname -I`). Same Wi‑Fi required.
 *
 * Start backend: cd backend && docker compose up -d && npm run dev
 */

/** Your dev machine LAN IP — used when USE_ADB_REVERSE is false. */
const DEV_MACHINE_HOST = '192.168.0.108';

/**
 * Physical Android over USB: forward ports with `npm run android:reverse`.
 * Set to false when testing on Wi‑Fi only (no USB / adb reverse).
 */
const USE_ADB_REVERSE = true;

const API_PORT = 3002;

function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  const fingerprint = (Platform.constants.Fingerprint ?? '').toLowerCase();
  const model = (Platform.constants.Model ?? '').toLowerCase();
  return (
    fingerprint.includes('generic') ||
    fingerprint.includes('unknown') ||
    model.includes('sdk') ||
    model.includes('emulator') ||
    model.includes('android sdk')
  );
}

export function devApiHost(): string {
  if (Platform.OS === 'ios') return 'localhost';

  if (Platform.OS === 'android') {
    if (isAndroidEmulator()) return '10.0.2.2';
    if (USE_ADB_REVERSE) return 'localhost';
    return DEV_MACHINE_HOST;
  }

  return 'localhost';
}

export const API_URL = `http://${devApiHost()}:${API_PORT}/api`;

export function socketBaseUrl(): string {
  return API_URL.replace(/\/api\/?$/, '');
}

/** Rewrite backend URLs that were stored with localhost (dev uploads). */
export function resolveDevServerUrl(url: string): string {
  if (!url) return url;
  const host = devApiHost();
  return url
    .replace(/^http:\/\/localhost:3002\b/, `http://${host}:${API_PORT}`)
    .replace(/^http:\/\/127\.0\.0\.1:3002\b/, `http://${host}:${API_PORT}`);
}
