import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

/** Pass as the axios config (or merge into it) to skip optional request metadata. */
export const silentRequest = { skipGlobalLoading: true };

const ACCESS_KEY = 'marketplace-access-token';
const REFRESH_KEY = 'marketplace-refresh-token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }
    original._retry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(err);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .then((r) => {
            setTokens({
              accessToken: r.data.data.accessToken,
              refreshToken: r.data.data.refreshToken,
            });
            return r.data.data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      clearTokens();
      return Promise.reject(err);
    }
  },
);

export function unwrap(response) {
  return response.data?.data ?? response.data;
}

export function mapApiError(err) {
  const msg = err?.response?.data?.message;
  const errors = err?.response?.data?.errors;
  if (errors?.length) return errors.map((e) => e.message).join(' ');
  return msg || err?.message || 'Something went wrong. Please try again.';
}

export default api;
