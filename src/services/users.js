/**
 * User profiles in Firestore `users/{uid}` — shared with mobile.
 * Compte Pro: `isPro: boolean`
 * Boutique: `shopName`, `shopLogoUrl`, `shopDescription`
 */
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const USERS_COLLECTION = 'users';

export function normalizeUserProfile(uid, raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      uid,
      isPro: false,
      role: '',
      shopName: '',
      shopLogoUrl: '',
      shopDescription: '',
      phoneNumber: '',
    };
  }
  return {
    uid,
    isPro: Boolean(raw.isPro),
    role: String(raw.role ?? '').trim().toLowerCase(),
    shopName: String(raw.shopName ?? raw.shop_name ?? raw.displayName ?? '').trim(),
    shopLogoUrl: String(raw.shopLogoUrl ?? raw.shop_logo_url ?? raw.photoURL ?? '').trim(),
    shopDescription: String(
      raw.shopDescription ?? raw.shop_description ?? raw.bio ?? raw.about ?? '',
    ).trim(),
    phoneNumber: String(raw.phoneNumber ?? raw.phone ?? '').trim(),
  };
}

/** Default profile shape when the Firestore doc is missing or the listener errors. */
export function makeEmptyUserProfile(uid) {
  return normalizeUserProfile(uid, null);
}

/**
 * After phone OTP sign-in: `users/{uid}` with `phoneNumber` (E.164 from Firebase Auth).
 * Creates a new profile for first-time registration; merges `phoneNumber` for returning users.
 */
export async function ensureUserProfileFromPhoneAuth(user) {
  if (!user?.uid) return;
  const phoneNumber = String(user.phoneNumber || '').trim();
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(
      ref,
      { phoneNumber, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return;
  }
  await setDoc(ref, {
    phoneNumber,
    displayName: phoneNumber || user.uid,
    authProvider: 'phone',
    isPro: false,
    shopName: '',
    shopLogoUrl: '',
    shopDescription: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeUser(uid, onChange, onError) {
  if (!uid) {
    onChange(normalizeUserProfile('', null));
    return () => {};
  }
  return onSnapshot(
    doc(db, USERS_COLLECTION, uid),
    (snap) => {
      if (!snap.exists()) onChange(normalizeUserProfile(uid, null));
      else onChange(normalizeUserProfile(uid, snap.data()));
    },
    (err) => onError?.(err),
  );
}
