import { useEffect, useState } from 'react';
import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Subscribes to Firebase Auth state changes.
 *
 * Returns:
 *   - `user`     — the current user, or `null` if signed out.
 *   - `initializing` — `true` only on first render, before Firebase has
 *                      told us whether there's a cached session. Use
 *                      this to render a splash screen instead of
 *                      flashing the logged-out UI.
 *
 * Listens via `onAuthStateChanged` so the entire app reacts to
 * sign-in / sign-up / sign-out from any screen, with no event bus.
 */
export function useAuthUser(): {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
} {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(() =>
    auth().currentUser,
  );
  const [initializing, setInitializing] = useState(() => auth().currentUser == null);

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((next) => {
      setUser(next);
      setInitializing(false);
    });
    return unsub;
  }, []);

  return { user, initializing };
}
