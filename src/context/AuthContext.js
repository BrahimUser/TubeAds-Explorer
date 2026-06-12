// JWT session via Express API (replaces Firebase Auth).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { clearTokens, getAccessToken, getRefreshToken, unwrap } from '../api/client';
import { isSuperAdminUid } from '../constants/superAdmin';
import { makeEmptyUserProfile, subscribeUser } from '../services/users';

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

function toAuthUser(profile) {
  if (!profile) return null;
  return {
    uid: profile.id || profile.uid,
    id: profile.id || profile.uid,
    phoneNumber: profile.phoneNumber,
    displayName: profile.displayName || profile.phoneNumber,
    email: null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const superAdminLogRef = useRef(null);

  const loadSession = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setUserProfile(null);
      setProfileReady(true);
      setReady(true);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      const { user: profile } = unwrap(res);
      setUser(toAuthUser(profile));
      setUserProfile({
        uid: profile.id,
        isPro: profile.isPro,
        role: String(profile.role || '').toLowerCase(),
        shopName: profile.shopName || '',
        shopLogoUrl: profile.shopLogoUrl || '',
        shopDescription: profile.shopDescription || '',
        phoneNumber: profile.phoneNumber || '',
      });
      setProfileReady(true);
    } catch {
      clearTokens();
      setUser(null);
      setUserProfile(null);
      setProfileReady(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user) superAdminLogRef.current = null;
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setUserProfile(null);
      setProfileReady(false);
      return undefined;
    }
    setProfileReady(false);
    const off = subscribeUser(
      user.uid,
      (profile) => {
        setUserProfile(profile);
        setProfileReady(true);
      },
      () => {
        setUserProfile(makeEmptyUserProfile(user.uid));
        setProfileReady(true);
      },
    );
    return off;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !isSuperAdminUid(user.uid)) return;
    if (superAdminLogRef.current === user.uid) return;
    superAdminLogRef.current = user.uid;
    // eslint-disable-next-line no-console
    console.log('Super Admin Detected: Access Granted');
  }, [user?.uid]);

  const role = useMemo(() => {
    if (!user) return null;
    if (isSuperAdminUid(user.uid)) return 'admin';
    if (!profileReady) return null;
    return userProfile?.role === 'admin' ? 'admin' : 'user';
  }, [user, profileReady, userProfile?.role]);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (isSuperAdminUid(user.uid)) return true;
    if (!profileReady) return false;
    return userProfile?.role === 'admin';
  }, [user, profileReady, userProfile?.role]);

  const signOut = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // best-effort
    }
    clearTokens();
    setUser(null);
    setUserProfile(null);
    setProfileReady(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isLoggedIn: !!user,
      userProfile,
      profileReady,
      role,
      isAdmin,
      signOut,
      refreshSession: loadSession,
    }),
    [user, ready, userProfile, profileReady, role, isAdmin, signOut, loadSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
