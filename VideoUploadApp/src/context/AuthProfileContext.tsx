import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import firestore from '@react-native-firebase/firestore';
import { USERS_COLLECTION } from '../constants/users';
import { useAuthUser } from '../hooks/useAuthUser';
import { parseIsAdminFromUserDoc, roleLabelFromUserDoc } from '../utils/userRole';

/** Promoted to Firestore `role: 'admin'` on login when missing — keeps web/mobile UIDs aligned. */
function isHardcodedAdminUid(uid: string): boolean {
  const isAdminUID =
    uid === 'GuXkAHaCl9NiNaJNezqi4OUSB82' || uid === 'hWbzZAQju2Ufbo8iLoaeKBqka6J3';
  return isAdminUID;
}

type UserProfileData = Record<string, unknown> | null;

type AuthProfileContextValue = {
  /** Raw Firestore `users/{uid}` payload, or null if missing / signed out */
  userProfile: UserProfileData;
  profileReady: boolean;
  /** True when Firestore indicates admin (`role` or `isAdmin`) */
  isAdmin: boolean;
  /** Lowercased `role` field from Firestore (empty string if absent) */
  role: string;
};

const AuthProfileContext = createContext<AuthProfileContextValue | null>(null);

export { AuthProfileContext };

export function AuthProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthUser();
  const [userProfile, setUserProfile] = useState<UserProfileData>(null);
  const [profileReady, setProfileReady] = useState(user == null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState('');

  const applyUserData = useCallback((data: UserProfileData, uid: string) => {
    const fromFs = parseIsAdminFromUserDoc(data ?? undefined);
    const hardcoded = isHardcodedAdminUid(uid);
    const admin = fromFs || hardcoded;
    setUserProfile(data);
    setIsAdmin(admin);
    setRole(
      admin ? 'admin' : data ? roleLabelFromUserDoc(data).toLowerCase() : '',
    );
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setUserProfile(null);
      setIsAdmin(false);
      setRole('');
      setProfileReady(true);
      return undefined;
    }

    const uid = user.uid;
    const ref = firestore().collection(USERS_COLLECTION).doc(uid);
    let cancelled = false;

    setProfileReady(false);

    void (async () => {
      try {
        const snap = await ref.get();
        const userData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
        // eslint-disable-next-line no-console
        console.log('Logged in UID:', uid, ' | Role from Firestore:', userData?.role);
        if (cancelled) return;
        applyUserData(userData, uid);
        const needsAdminWrite =
          isHardcodedAdminUid(uid) &&
          (!userData ||
            String(userData.role ?? '')
              .trim()
              .toLowerCase() !== 'admin');
        if (needsAdminWrite && !cancelled) {
          try {
            await ref.set(
              {
                role: 'admin',
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          } catch (writeErr) {
            // eslint-disable-next-line no-console
            console.warn('[AuthProfile] could not sync role:admin to Firestore', writeErr);
          }
        }
        setProfileReady(true);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[AuthProfile] initial get() failed', e);
        if (!cancelled) {
          applyUserData(null, uid);
          setProfileReady(true);
        }
      }
    })();

    const unsubSnap = ref.onSnapshot(
      (snap) => {
        const userData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
        applyUserData(userData, uid);
        const needsAdminWrite =
          isHardcodedAdminUid(uid) &&
          (!userData ||
            String(userData.role ?? '')
              .trim()
              .toLowerCase() !== 'admin');
        if (needsAdminWrite && !cancelled) {
          void ref
            .set(
              {
                role: 'admin',
                updatedAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            )
            .catch((writeErr) => {
              // eslint-disable-next-line no-console
              console.warn('[AuthProfile] could not sync role:admin to Firestore', writeErr);
            });
        }
        setProfileReady(true);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.warn('[AuthProfile] onSnapshot error, retrying get()', err);
        void ref
          .get()
          .then((snap) => {
            const userData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
            if (!cancelled) {
              applyUserData(userData, uid);
              setProfileReady(true);
            }
          })
          .catch(() => {
            if (!cancelled) setProfileReady(true);
          });
      },
    );

    return () => {
      cancelled = true;
      unsubSnap();
    };
  }, [user?.uid, applyUserData]);

  const value = useMemo<AuthProfileContextValue>(
    () => ({
      userProfile,
      profileReady,
      isAdmin,
      role,
    }),
    [userProfile, profileReady, isAdmin, role],
  );

  return <AuthProfileContext.Provider value={value}>{children}</AuthProfileContext.Provider>;
}

export function useAuthProfile(): AuthProfileContextValue {
  const ctx = useContext(AuthProfileContext);
  if (!ctx) {
    throw new Error('useAuthProfile must be used within AuthProfileProvider');
  }
  return ctx;
}
