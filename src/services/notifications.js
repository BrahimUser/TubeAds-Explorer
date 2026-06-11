import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const NOTIFICATIONS = 'notifications';

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  return uid;
}

export function buildSenderName(user) {
  if (!user) return '';
  const d = String(user.displayName || '').trim();
  if (d) return d;
  const email = String(user.email || '').trim();
  if (email) return email.split('@')[0];
  return 'Utilisateur';
}

/**
 * Create a notification for a recipient.
 *
 * Schema:
 *  - recipientId: string
 *  - senderName: string
 *  - message: string
 *  - type: 'new_message' | 'order_status' | string
 *  - isRead: boolean
 *  - createdAt: serverTimestamp()
 *  - link: optional payload to support routing
 */
export async function createNotification(input) {
  const senderUid = requireUid();
  const recipientId = String(input?.recipientId || '').trim();
  if (!recipientId) throw new Error('Missing recipientId.');
  if (recipientId === senderUid) return;

  const batch = writeBatch(db);
  const ref = doc(collection(db, NOTIFICATIONS));
  batch.set(ref, {
    recipientId,
    senderName: String(input?.senderName || '').trim(),
    message: String(input?.message || '').trim(),
    type: String(input?.type || '').trim() || 'generic',
    isRead: false,
    createdAt: serverTimestamp(),
    link: input?.link && typeof input.link === 'object' ? input.link : null,
  });
  await batch.commit();
}

export function listenUnreadNotificationsCount(uid, onCount, onError) {
  if (!uid) {
    onCount?.(0);
    return () => {};
  }
  const q = query(
    collection(db, NOTIFICATIONS),
    where('recipientId', '==', uid),
    where('isRead', '==', false),
    limit(50),
  );
  return onSnapshot(
    q,
    (snap) => onCount?.(snap.size),
    (err) => onError?.(err),
  );
}

export function listenRecentNotifications(uid, onChange, onError) {
  if (!uid) {
    onChange?.([]);
    return () => {};
  }
  const q = query(
    collection(db, NOTIFICATIONS),
    where('recipientId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(12),
  );
  return onSnapshot(
    q,
    (snap) => onChange?.(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

export async function markNotificationRead(notificationId) {
  const uid = requireUid();
  if (!notificationId) return;
  await updateDoc(doc(db, NOTIFICATIONS, notificationId), {
    isRead: true,
    readAt: serverTimestamp(),
    readBy: uid,
  });
}

