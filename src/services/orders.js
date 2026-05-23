// Orders read layer. Same `orders` collection the React Native app writes to
// via VideoUploadApp/src/services/commerceFirestore.ts — so when a buyer taps
// "Buy" on mobile, the seller sees it appear here in real time.
//
// Order doc shape (see VideoUploadApp/src/types/Commerce.ts):
//   { buyerUid, sellerUid, adId, adTitle, adThumbnailUrl,
//     priceCents, currency, delivery: {...}, deliveryMethod, paymentMethod,
//     status: 'pending' | 'confirmed' | 'shipped' | 'cancelled',
//     orderNumber, subtotalCents, shippingFeeCents, totalCents,
//     createdAt, updatedAt }
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const ORDERS = 'orders';
const NOTIFICATIONS = 'notifications';

const STATUS_FALLBACK = {
  // Canonical values (web writes these).
  pending: 'pending',
  confirmed: 'confirmed',
  shipped: 'shipped',
  cancelled: 'cancelled',
  // Legacy values from older builds (mobile / early web).
  Pending: 'pending',
  'In Progress': 'confirmed',
  Completed: 'shipped',
  Cancelled: 'cancelled',
  preparing: 'confirmed',
  shipping: 'confirmed',
  delivered: 'shipped',
};

export function normalizeOrderStatus(raw) {
  return STATUS_FALLBACK[String(raw ?? '').trim()] || 'pending';
}

function parseOrder(id, raw) {
  const priceCents = Number(raw.priceCents) || 0;
  const subtotalCents = Number(raw.subtotalCents ?? raw.priceCents) || priceCents;
  const shippingFeeCents = Number(raw.shippingFeeCents ?? 0) || 0;
  const totalCents =
    Number(raw.totalCents ?? subtotalCents + shippingFeeCents) || subtotalCents + shippingFeeCents;
  return {
    id,
    buyerUid: String(raw.buyerUid ?? ''),
    sellerUid: String(raw.sellerUid ?? ''),
    adId: String(raw.adId ?? ''),
    adTitle: String(raw.adTitle ?? ''),
    adThumbnailUrl: String(raw.adThumbnailUrl ?? ''),
    priceCents,
    currency: raw.currency || 'MAD',
    delivery: raw.delivery || {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      zip: '',
    },
    deliveryMethod: raw.deliveryMethod || 'home',
    paymentMethod: raw.paymentMethod || 'cash',
    status: normalizeOrderStatus(raw.status),
    orderNumber: String(raw.orderNumber || `ORD-${id.slice(-6).toUpperCase()}`),
    subtotalCents,
    shippingFeeCents,
    totalCents,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  return uid;
}

/**
 * Génère un numéro de commande humain (court, lisible) — les ordres sont
 * également identifiés par leur `id` Firestore mais ce numéro est plus
 * pratique côté UI ("ORD-AB12CD").
 */
function buildOrderNumber() {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${rnd}`;
}

/**
 * Crée une nouvelle commande Firestore (`orders/{auto}`) à partir des données
 * collectées dans le checkout. Renvoie `{ id, orderNumber }`.
 *
 * Schéma compatible avec la version mobile (VideoUploadApp/src/services/commerceFirestore.ts) :
 *   - buyerUid, sellerUid, adId, adTitle, adThumbnailUrl
 *   - priceCents, currency
 *   - delivery: { fullName, phone, address, city, zip, notes? }
 *   - deliveryMethod: 'home' | 'pickup'
 *   - paymentMethod: 'cash' | 'card'
 *   - subtotalCents, shippingFeeCents, totalCents
 *   - status: 'Pending'
 *   - orderNumber, createdAt, updatedAt
 */
export async function placeOrder(input) {
  const buyerUid = requireUid();
  if (!input || typeof input !== 'object') throw new Error('Missing order data.');
  if (!input.adId) throw new Error('Missing listing.');
  if (!input.sellerUid) throw new Error('Missing seller.');
  if (input.sellerUid === buyerUid) {
    throw new Error('Vous ne pouvez pas commander votre propre annonce.');
  }

  const subtotalCents = Math.max(0, Number(input.subtotalCents) || 0);
  const shippingFeeCents = Math.max(0, Number(input.shippingFeeCents) || 0);
  const totalCents = subtotalCents + shippingFeeCents;
  const orderNumber = buildOrderNumber();

  const ref = await addDoc(collection(db, ORDERS), {
    buyerUid,
    sellerUid: String(input.sellerUid),
    adId: String(input.adId),
    adTitle: String(input.adTitle || ''),
    adThumbnailUrl: String(input.adThumbnailUrl || ''),
    priceCents: subtotalCents,
    currency: input.currency || 'MAD',
    delivery: {
      fullName: String(input.delivery?.fullName || '').trim(),
      phone: String(input.delivery?.phone || '').trim(),
      address: String(input.delivery?.address || '').trim(),
      city: String(input.delivery?.city || '').trim(),
      zip: String(input.delivery?.zip || '').trim(),
      notes: String(input.delivery?.notes || '').trim(),
    },
    deliveryMethod: input.deliveryMethod === 'pickup' ? 'pickup' : 'home',
    paymentMethod: input.paymentMethod === 'card' ? 'card' : 'cash',
    subtotalCents,
    shippingFeeCents,
    totalCents,
    status: 'pending',
    orderNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id, orderNumber };
}

/**
 * Live feed of orders **received** by the current seller. Mirrors mobile
 * `listenSellerOrders`. Composite index needed: `sellerUid` + `createdAt` desc.
 */
export function listenSellerOrders(uid, onChange, onError) {
  const q = query(
    collection(db, ORDERS),
    where('sellerUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => parseOrder(d.id, d.data()))),
    (err) => onError && onError(err),
  );
}

/**
 * Live feed of orders **placed** by the current buyer. Available for future
 * use (e.g. an "Orders I placed" tab). Same query mobile `listenBuyerOrders`
 * uses. Composite index needed: `buyerUid` + `createdAt` desc.
 */
export function listenBuyerOrders(uid, onChange, onError) {
  const q = query(
    collection(db, ORDERS),
    where('buyerUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(100),
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => parseOrder(d.id, d.data()))),
    (err) => onError && onError(err),
  );
}

/**
 * Seller-only status transitions. Same allowed transitions as the mobile
 * `sellerAdvanceOrder`: pending → confirmed (confirm), confirmed → shipped.
 * The Firestore rules on the mobile side already gate this by
 * sellerUid; we still check on the client to fail fast with a clear message.
 */
export async function sellerAdvanceOrder(order, action) {
  const uid = requireUid();
  if (order.sellerUid !== uid) {
    throw new Error('Only the seller can update this order.');
  }
  if (action === 'confirm' && order.status !== 'pending') {
    throw new Error('Only pending orders can be confirmed.');
  }
  if (action === 'mark_shipped' && order.status !== 'confirmed') {
    throw new Error('Only in-progress orders can be marked shipped.');
  }
  const nextStatus = action === 'confirm' ? 'confirmed' : 'shipped';
  await updateDoc(doc(db, ORDERS, order.id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  // Notify buyer when the seller confirms the order.
  if (action === 'confirm' && order.buyerUid) {
    const sellerName =
      auth.currentUser?.displayName?.trim() ||
      auth.currentUser?.email?.trim() ||
      'Vendeur';
    await addDoc(collection(db, NOTIFICATIONS), {
      recipientId: String(order.buyerUid),
      senderName: sellerName,
      message: `Commande ${order.orderNumber || ''} confirmée par le vendeur`.trim(),
      type: 'order_status',
      isRead: false,
      createdAt: serverTimestamp(),
      link: { type: 'orders', orderId: order.id },
    });
  }
}

/** Cancel a pending order (seller side). Buyer-side cancel can be added later. */
export async function sellerCancelOrder(order) {
  const uid = requireUid();
  if (order.sellerUid !== uid) {
    throw new Error('Only the seller can cancel this order.');
  }
  if (order.status === 'shipped' || order.status === 'cancelled') {
    throw new Error('This order can no longer be cancelled.');
  }
  await updateDoc(doc(db, ORDERS, order.id), {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}
