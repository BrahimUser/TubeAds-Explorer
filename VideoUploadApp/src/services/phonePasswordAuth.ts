/**
 * Phone + password auth (no SMS) — mirrors `marketplace-web/src/services/phonePasswordAuth.js`.
 * Uses Email/Password with a synthetic email derived from E.164 so `uid` matches `users/{uid}`.
 */
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import * as base64 from 'base-64';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { USERS_COLLECTION } from '../constants/users';

const PBKDF2_ITERATIONS = 100_000;

export function syntheticEmailFromE164(e164: string): string {
  const digits = String(e164 || '').replace(/\D/g, '');
  return `${digits}@phone.marketplace.web`;
}

/** Build E.164 for Morocco (+212) from local digits (strip leading 0). */
export function buildMoroccoE164(localDigits: string): string | null {
  const digits = String(localDigits || '').replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('0')) national = national.slice(1);
  if (national.startsWith('212')) national = national.slice(3);
  if (national.length < 9) return null;
  return `+212${national.slice(0, 12)}`;
}

function bufToB64(buf: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]!);
  return base64.encode(bin);
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = base64.decode(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function constantTimeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  return r === 0;
}

export function hashPassword(password: string, saltB64: string): string {
  const salt = b64ToBuf(saltB64);
  const dk = pbkdf2(sha256, utf8ToBytes(password), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  });
  return bufToB64(dk);
}

export function verifyPassword(
  password: string,
  saltB64: string,
  expectedHashB64: string,
): boolean {
  const h = hashPassword(password, saltB64);
  return constantTimeEqualStr(h, expectedHashB64);
}

function randomSaltB64(): string {
  return bufToB64(randomBytes(16));
}

/** Best-effort duplicate check — may be blocked by rules when signed out. */
export async function isPhoneRegisteredInFirestore(e164: string): Promise<boolean | null> {
  try {
    const snap = await firestore()
      .collection(USERS_COLLECTION)
      .where('phoneNumber', '==', e164)
      .limit(1)
      .get();
    return !snap.empty;
  } catch {
    return null;
  }
}

export function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'This phone number is already registered.',
    'auth/invalid-email': 'Invalid phone format.',
    'auth/invalid-credential': 'Wrong phone number or password.',
    'auth/wrong-password': 'Wrong phone number or password.',
    'auth/user-not-found': 'Wrong phone number or password.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return (
    map[code] ||
    (typeof (err as Error)?.message === 'string' ? (err as Error).message : null) ||
    'Something went wrong. Please try again.'
  );
}

export async function registerWithPhonePassword(
  localPhone: string,
  password: string,
): Promise<FirebaseAuthTypes.User> {
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
  const methods = await auth().fetchSignInMethodsForEmail(email);
  if (methods.length > 0) {
    throw new Error('This phone number is already registered.');
  }

  const cred = await auth().createUserWithEmailAndPassword(email, password);
  const salt = randomSaltB64();
  const passwordHash = hashPassword(password, salt);

  await firestore()
    .collection(USERS_COLLECTION)
    .doc(cred.user.uid)
    .set({
      phoneNumber: e164,
      passwordHash,
      passwordSalt: salt,
      displayName: e164,
      isPro: false,
      shopName: '',
      shopLogoUrl: '',
      shopDescription: '',
      authProvider: 'phone_password',
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

  return cred.user;
}

export async function signInWithPhonePassword(
  localPhone: string,
  password: string,
): Promise<FirebaseAuthTypes.User> {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) throw new Error('Invalid phone number.');
  if (!password) throw new Error('Please enter your password.');

  const email = syntheticEmailFromE164(e164);
  const cred = await auth().signInWithEmailAndPassword(email, password);

  const ref = firestore().collection(USERS_COLLECTION).doc(cred.user.uid);
  const snap = await ref.get();
  if (snap.exists()) {
    const d = snap.data() || {};
    if (typeof d.passwordHash === 'string' && typeof d.passwordSalt === 'string') {
      const ok = verifyPassword(password, d.passwordSalt, d.passwordHash);
      if (!ok) {
        await auth().signOut();
        throw new Error('Wrong phone number or password.');
      }
    }
  }

  return cred.user;
}
