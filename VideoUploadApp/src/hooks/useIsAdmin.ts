import { useContext } from 'react';
import { AuthProfileContext } from '../context/AuthProfileContext';

/**
 * Admin flag from global profile state (Firestore `users/{uid}` at login + live updates).
 * Safe when used outside `AuthProfileProvider` (returns not admin).
 */
export function useIsAdmin(): { isAdmin: boolean; ready: boolean } {
  const ctx = useContext(AuthProfileContext);
  if (!ctx) {
    return { isAdmin: false, ready: true };
  }
  return { isAdmin: ctx.isAdmin, ready: ctx.profileReady };
}
