import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'marketplace-access-token';
const REFRESH_KEY = 'marketplace-refresh-token';

let cachedAccessToken: string | null | undefined;
let cachedRefreshToken: string | null | undefined;

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken !== undefined) {
    return cachedAccessToken;
  }
  cachedAccessToken = await AsyncStorage.getItem(ACCESS_KEY);
  return cachedAccessToken;
}

export async function getRefreshToken(): Promise<string | null> {
  if (cachedRefreshToken !== undefined) {
    return cachedRefreshToken;
  }
  cachedRefreshToken = await AsyncStorage.getItem(REFRESH_KEY);
  return cachedRefreshToken;
}

export async function setTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): Promise<void> {
  if (tokens.accessToken) {
    cachedAccessToken = tokens.accessToken;
    await AsyncStorage.setItem(ACCESS_KEY, tokens.accessToken);
  }
  if (tokens.refreshToken) {
    cachedRefreshToken = tokens.refreshToken;
    await AsyncStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  cachedAccessToken = null;
  cachedRefreshToken = null;
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
