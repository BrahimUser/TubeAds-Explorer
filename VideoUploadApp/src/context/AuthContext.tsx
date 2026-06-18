import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, unwrap } from '../api/client';
import { disconnectSocket } from '../services/socket';
import {
  notifyAuthSignedOut,
  appUsersEqual,
  profileToAppUser,
  registerAuthSignOutListener,
  type AppUser,
} from '../types/AppUser';

type AuthContextValue = {
  user: AppUser | null;
  initializing: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      const data = unwrap<{ user: Record<string, unknown> }>(res);
      const next = profileToAppUser(data.user ?? {});
      setUser((prev) => (appUsersEqual(prev, next) ? prev : next));
    } catch {
      await clearTokens();
      setUser(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
      }
    } finally {
      await clearTokens();
      disconnectSocket();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshSession();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  useEffect(() => registerAuthSignOutListener(() => setUser(null)), []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, refreshSession, signOut }),
    [user, initializing, refreshSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function useAuthUser(): {
  user: AppUser | null;
  initializing: boolean;
} {
  const { user, initializing } = useAuth();
  return { user, initializing };
}

export { notifyAuthSignedOut };
