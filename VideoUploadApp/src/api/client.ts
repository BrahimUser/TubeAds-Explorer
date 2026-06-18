import axios, { type AxiosRequestConfig } from 'axios';
import { API_URL } from '../config/api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStorage';

/** Pass as axios config to skip optional global loading metadata. */
export const silentRequest = { skipGlobalLoading: true } as AxiosRequestConfig;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as AxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }
    original._retry = true;

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearTokens();
      return Promise.reject(err);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .then(async (r) => {
            const accessToken = r.data.data.accessToken as string;
            const nextRefresh = r.data.data.refreshToken as string | undefined;
            await setTokens({ accessToken, refreshToken: nextRefresh });
            return accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      await clearTokens();
      return Promise.reject(err);
    }
  },
);

export function unwrap<T = unknown>(response: { data?: { data?: T } }): T {
  return (response.data?.data ?? response.data) as T;
}

export function mapApiError(err: unknown): string {
  const ax = err as {
    response?: { data?: { message?: string; errors?: { message: string }[] } };
    message?: string;
    code?: string;
  };
  const msg = ax?.response?.data?.message;
  const errors = ax?.response?.data?.errors;
  if (errors?.length) return errors.map((e) => e.message).join(' ');
  if (ax?.message === 'Network Error' || ax?.code === 'ECONNABORTED') {
    return `Cannot reach the API at ${API_URL}. Run the backend, then \`npm run android:reverse\` if using USB.`;
  }
  return msg || ax?.message || 'Something went wrong. Please try again.';
}

export { getAccessToken, getRefreshToken, setTokens, clearTokens };
export default api;
