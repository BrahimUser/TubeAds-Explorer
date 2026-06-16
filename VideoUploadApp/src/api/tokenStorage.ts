import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'marketplace-access-token';
const REFRESH_KEY = 'marketplace-refresh-token';

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}

export async function setTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}): Promise<void> {
  if (tokens.accessToken) {
    await AsyncStorage.setItem(ACCESS_KEY, tokens.accessToken);
  }
  if (tokens.refreshToken) {
    await AsyncStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}
