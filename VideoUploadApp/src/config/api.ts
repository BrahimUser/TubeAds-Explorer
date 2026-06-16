import { Platform } from 'react-native';

/**
 * Express API base URL.
 *
 * - Android emulator: 10.0.2.2 maps to host localhost
 * - iOS simulator: use http://localhost:3002/api
 * - Physical device: use your machine LAN IP, e.g. http://192.168.1.10:3002/api
 *
 * Start backend: cd backend && docker compose up -d && npm run dev
 */
const ANDROID_EMULATOR_API = 'http://10.0.2.2:3002/api';
const IOS_SIMULATOR_API = 'http://localhost:3002/api';

export const API_URL = Platform.OS === 'android' ? ANDROID_EMULATOR_API : IOS_SIMULATOR_API;

export function socketBaseUrl(): string {
  return API_URL.replace(/\/api\/?$/, '');
}
