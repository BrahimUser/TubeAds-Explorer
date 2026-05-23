/**
 * Phone + password auth (no SMS billing).
 *
 * Uses Firebase **Email/Password** with a deterministic synthetic email derived from
 * E.164 so `auth.currentUser.uid` stays aligned with `users/{uid}` for Firestore rules.
 * Password is also stored as **PBKDF2-SHA256** (salt + hash) in Firestore for your
 * “compare against users collection” requirement on sign-in when the profile doc exists.
 */
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { USERS_COLLECTION } from './users';

const PBKDF2_ITERATIONS = 100_000;

/** Internal login id — not a real mailbox; unique per national number. */
export function syntheticEmailFromE164(e164) {
  const digits = String(e164 || '').replace(/\D/g, '');
  return `${digits}@phone.marketplace.web`;
}

/** Build E.164 for Morocco (+212) from local digits (strip leading 0). */
export function buildMoroccoE164(localDigits) {
  const digits = String(localDigits || '').replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('0')) national = national.slice(1);
  if (national.startsWith('212')) national = national.slice(3);
  if (national.length < 9) return null;
  return `+212${national.slice(0, 12)}`;
}

function randomSaltB64() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function hashPassword(password, saltB64) {
  const enc = new TextEncoder();
  const salt = b64ToBuf(saltB64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return bufToB64(bits);
}

function constantTimeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function verifyPassword(password, saltB64, expectedHashB64) {
  const h = await hashPassword(password, saltB64);
  return constantTimeEqualStr(h, expectedHashB64);
}

/**
 * Best-effort Firestore duplicate check (may fail if rules block unauthenticated reads).
 * @returns {boolean|null} true if taken, false if free, null if unknown
 */
export async function isPhoneRegisteredInFirestore(e164) {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('phoneNumber', '==', e164),
      limit(1),
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return null;
  }
}

export function mapFirebaseAuthError(err) {
  const code = err?.code || '';
  const map = {
    'auth/email-already-in-use': 'This phone number is already registered.',
    'auth/invalid-email': 'Invalid phone format.',
    'auth/invalid-credential': 'Wrong phone number or password.',
    'auth/wrong-password': 'Wrong phone number or password.',
    'auth/user-not-found': 'Wrong phone number or password.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || err?.message || 'Something went wrong. Please try again.';
}

/**
 * Register: checks Firestore (if allowed) + Firebase email collision, then creates Auth user + user doc.
 */
export async function registerWithPhonePassword(localPhone, password) {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const takenFs = await isPhoneRegisteredInFirestore(e164);
  if (takenFs === true) {
    throw new Error('This phone number is already registered.');
  }

  const email = syntheticEmailFromE164(e164);
  const methods = await fetchSignInMethodsForEmail(auth, email);
  if (methods.length > 0) {
    throw new Error('This phone number is already registered.');
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const salt = randomSaltB64();
  const passwordHash = await hashPassword(password, salt);

  await setDoc(doc(db, USERS_COLLECTION, cred.user.uid), {
    phoneNumber: e164,
    passwordHash,
    passwordSalt: salt,
    displayName: e164,
    isPro: false,
    shopName: '',
    shopLogoUrl: '',
    shopDescription: '',
    authProvider: 'phone_password',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return cred.user;
}

/**
 * Sign in: Firebase verifies password; if Firestore has PBKDF2 fields, verify them too then stay signed in.
 */
export async function signInWithPhonePassword(localPhone, password) {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password) throw new Error('Please enter your password.');

  const email = syntheticEmailFromE164(e164);
  const cred = await signInWithEmailAndPassword(auth, email, password);

  const ref = doc(db, USERS_COLLECTION, cred.user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const d = snap.data() || {};
    if (d.passwordHash && d.passwordSalt) {
      const ok = await verifyPassword(password, d.passwordSalt, d.passwordHash);
      if (!ok) {
        await fbSignOut(auth);
        throw new Error('Wrong phone number or password.');
      }
    }
  }

  return cred.user;
}
