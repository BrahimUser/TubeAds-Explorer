// Firebase Auth session (email/password mapped from phone — see phonePasswordAuth.js).
// `isLoggedIn` mirrors `user` for navbar and gated UI.
// `role` merges super-admin UID + Firestore `users/{uid}.role` (synced in real time).
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { isSuperAdminUid } from '../constants/superAdmin';
import { auth, db } from '../firebase';
import { USERS_COLLECTION, makeEmptyUserProfile, subscribeUser } from '../services/users';

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
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileReady, setProfileReady] = useState(false);
  const superAdminLogRef = useRef(null);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return off;
  }, []);

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

  /** One-shot read after login — debugging + parity with mobile immediate `get()`. */
  useEffect(() => {
    if (!user?.uid) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, USERS_COLLECTION, user.uid);
        const snap = await getDoc(ref);
        const userData = snap.exists() ? snap.data() : null;
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.log('Logged in UID:', user.uid, '| Role from Firestore:', userData?.role);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] users/{uid} get()', e);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const value = useMemo(
    () => ({
      user,
      ready,
      isLoggedIn: !!user,
      userProfile,
      profileReady,
      role,
      isAdmin,
      signOut: () => fbSignOut(auth),
    }),
    [user, ready, userProfile, profileReady, role, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
