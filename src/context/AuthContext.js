// JWT session via Express API (replaces Firebase Auth).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { disconnectSocket } from '../services/socket';
import { isSuperAdminUid } from '../constants/superAdmin';
import { makeEmptyUserProfile } from '../services/users';
import { useAuthMe, clearAuthAndCache } from '../queries/useAuth';
import { useUser } from '../queries/useUsers';
import { queryKeys } from '../queries/keys';
import api, { getRefreshToken } from '../api/client';

const AuthContext = createContext({
  user: null,
  ready: false,
  isLoggedIn: false,
  userProfile: null,
  profileReady: false,
  role: null,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const superAdminLogRef = useRef(null);

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useAuthMe();
  const user = session?.user ?? null;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isError: profileError,
  } = useUser(user?.uid, { enabled: !!user?.uid });

  const ready = !sessionLoading;
  const profileReady = !user?.uid || (!profileLoading && (profileError || !!userProfile));

  useEffect(() => {
    if (!user) superAdminLogRef.current = null;
  }, [user]);

  useEffect(() => {
    if (!user?.uid || !isSuperAdminUid(user.uid)) return;
    if (superAdminLogRef.current === user.uid) return;
    superAdminLogRef.current = user.uid;
    // eslint-disable-next-line no-console
    console.log('Super Admin Detected: Access Granted');
  }, [user?.uid]);

  const resolvedProfile = useMemo(() => {
    if (!user?.uid) return null;
    if (userProfile) return userProfile;
    if (profileReady) return makeEmptyUserProfile(user.uid);
    return null;
  }, [user?.uid, userProfile, profileReady]);

  const role = useMemo(() => {
    if (!user) return null;
    if (isSuperAdminUid(user.uid)) return 'admin';
    if (!profileReady) return null;
    return resolvedProfile?.role === 'admin' ? 'admin' : 'user';
  }, [user, profileReady, resolvedProfile?.role]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (isSuperAdminUid(user.uid)) return true;
    if (!profileReady) return false;
    return resolvedProfile?.role === 'admin';
  }, [user, profileReady, resolvedProfile?.role]);

  const signOut = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // best-effort
    }
    disconnectSocket();
    clearAuthAndCache(queryClient);
    window.location.assign('/');
  }, [queryClient]);

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    return refetchSession();
  }, [queryClient, refetchSession]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isLoggedIn: !!user,
      userProfile: resolvedProfile,
      profileReady,
      role,
      isAdmin,
      signOut,
      refreshSession,
    }),
    [user, ready, resolvedProfile, profileReady, role, isAdmin, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
