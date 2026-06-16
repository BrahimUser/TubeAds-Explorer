import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { Ad, Currency } from '../types/Ad';
import type {
  ChatMessage,
  ChatThread,
  DeliveryMethod,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../types/Commerce';

/**
 * Marketplace commerce: **orders**, **chatThreads**, **messages**.
 *
 * Indexes (examples):
 * - `orders`: `buyerUid` + `createdAt` desc; `sellerUid` + `createdAt` desc; `status` + `sellerUid` + `createdAt` (if filtering by status server-side)
 * - `chatThreads`: `participantIds` array-contains + `createdAt` desc
 */
const ordersCol = () => firestore().collection('orders');
const chatThreadsCol = () => firestore().collection('chatThreads');

function threadMessagesCol(threadId: string) {
  return chatThreadsCol().doc(threadId).collection('messages');
}

function requireUid(): string {
  const uid = auth().currentUser?.uid;
  if (!uid) throw new Error('You must be signed in.');
  return uid;
}

function orderedParticipantIds(a: string, b: string): string[] {
  return a < b ? [a, b] : [b, a];
}

/** Normalize legacy lowercase statuses and new title-case values. */
export function normalizeOrderStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? '').trim();
  const map: Record<string, OrderStatus> = {
    Pending: 'Pending',
    'In Progress': 'In Progress',
    Completed: 'Completed',
    Cancelled: 'Cancelled',
    pending: 'Pending',
    confirmed: 'In Progress',
    preparing: 'In Progress',
    shipping: 'In Progress',
    delivered: 'Completed',
    cancelled: 'Cancelled',
  };
  return map[s] ?? 'Pending';
}

function parseOrderDoc(id: string, raw: Record<string, unknown>): Order {
  const status = normalizeOrderStatus(raw.status);
  const priceCents = Number(raw.priceCents) || 0;
  const subtotalCents = Number(raw.subtotalCents ?? raw.priceCents) || priceCents;
  const shippingFeeCents = Number(raw.shippingFeeCents ?? 0) || 0;
  const totalCents = Number(raw.totalCents ?? subtotalCents + shippingFeeCents);
  return {
    id,
    buyerUid: String(raw.buyerUid ?? ''),
    sellerUid: String(raw.sellerUid ?? ''),
    adId: String(raw.adId ?? ''),
    adTitle: String(raw.adTitle ?? ''),
    adThumbnailUrl: String(raw.adThumbnailUrl ?? ''),
    priceCents,
    currency: (raw.currency as Currency) ?? 'MAD',
    delivery: (raw.delivery as Order['delivery']) ?? {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      zip: '',
    },
    deliveryMethod: (raw.deliveryMethod as DeliveryMethod) ?? 'home',
    paymentMethod: (raw.paymentMethod as PaymentMethod) ?? 'cash',
    status,
    orderNumber: String(raw.orderNumber ?? `ORD-${id.slice(-6).toUpperCase()}`),
    subtotalCents,
    shippingFeeCents,
    totalCents,
    timeline: Array.isArray(raw.timeline) ? (raw.timeline as Order['timeline']) : undefined,
    createdAt: (raw.createdAt as Order['createdAt']) ?? null,
    updatedAt: (raw.updatedAt as Order['updatedAt']) ?? null,
  };
}

export function orderMatchesBuyerTab(
  order: Order,
  tab: 'ongoing' | 'completed' | 'cancelled',
): boolean {
  const s = order.status;
  if (tab === 'cancelled') return s === 'Cancelled';
  if (tab === 'completed') return s === 'Completed';
  return s === 'Pending' || s === 'In Progress';
}

export function orderMatchesSellerChip(order: Order, chip: 'all' | OrderStatus): boolean {
  if (chip === 'all') return true;
  return order.status === chip;
}

export async function createOrderFromCheckout(input: {
  ad: Ad;
  delivery: Order['delivery'];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
}): Promise<string> {
  const buyerUid = requireUid();
  const sellerUid = input.ad.ownerUid;
  if (sellerUid === buyerUid) {
    throw new Error('You cannot order your own listing.');
  }
  const now = firestore.FieldValue.serverTimestamp();
  const subtotalCents = input.ad.priceCents;
  const shippingFeeCents = 0;
  const totalCents = subtotalCents + shippingFeeCents;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const ref = await ordersCol().add({
    buyerUid,
    sellerUid,
    adId: input.ad.id,
    adTitle: input.ad.title,
    adThumbnailUrl: input.ad.thumbnailUrl,
    priceCents: input.ad.priceCents,
    currency: input.ad.currency,
    delivery: input.delivery,
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
    status: 'Pending' satisfies OrderStatus,
    orderNumber,
    subtotalCents,
    shippingFeeCents,
    totalCents,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export function listenBuyerOrders(
  onChange: (orders: Order[]) => void,
  onError: (e: Error) => void,
): () => void {
  let uid: string;
  try {
    uid = requireUid();
  } catch (e) {
    onError(e as Error);
    return () => {};
  }
  return ordersCol()
    .where('buyerUid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(80)
    .onSnapshot(
      (snap) => {
        const list = snap.docs.map((d) => parseOrderDoc(d.id, d.data() as Record<string, unknown>));
        onChange(list);
      },
      (err) => onError(err as Error),
    );
}

export function listenSellerOrders(
  onChange: (orders: Order[]) => void,
  onError: (e: Error) => void,
): () => void {
  let uid: string;
  try {
    uid = requireUid();
  } catch (e) {
    onError(e as Error);
    return () => {};
  }
  return ordersCol()
    .where('sellerUid', '==', uid)
    .orderBy('createdAt', 'desc')
    .limit(80)
    .onSnapshot(
      (snap) => {
        const list = snap.docs.map((d) => parseOrderDoc(d.id, d.data() as Record<string, unknown>));
        onChange(list);
      },
      (err) => onError(err as Error),
    );
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const doc = await ordersCol().doc(orderId).get();
  if (!doc.exists()) return null;
  return parseOrderDoc(doc.id, doc.data() as Record<string, unknown>);
}

/**
 * Seller-only status updates. Validates allowed transitions.
 */
export async function sellerAdvanceOrder(orderId: string, action: 'confirm' | 'mark_shipped'): Promise<void> {
  const uid = requireUid();
  const ref = ordersCol().doc(orderId);
  const snap = await ref.get();
  if (!snap.exists()) throw new Error('Order not found.');
  const order = parseOrderDoc(snap.id, snap.data() as Record<string, unknown>);
  if (order.sellerUid !== uid) throw new Error('Only the seller can update this order.');
  const now = firestore.FieldValue.serverTimestamp();
  if (action === 'confirm') {
    if (order.status !== 'Pending') throw new Error('Only pending orders can be confirmed.');
    await ref.update({ status: 'In Progress', updatedAt: now });
  } else {
    if (order.status !== 'In Progress') throw new Error('Only in-progress orders can be marked shipped.');
    await ref.update({ status: 'Completed', updatedAt: now });
  }
}

export async function ensureChatThreadForOrder(ad: Ad, buyerUid: string): Promise<string> {
  const sellerUid = ad.ownerUid;
  if (sellerUid === buyerUid) {
    throw new Error('You cannot message yourself on your own listing.');
  }
  const existing = await chatThreadsCol()
    .where('adId', '==', ad.id)
    .where('buyerUid', '==', buyerUid)
    .limit(1)
    .get();
  if (!existing.empty) {
    return existing.docs[0].id;
  }
  const participants = orderedParticipantIds(buyerUid, sellerUid);
  const priceLabel = `${(ad.priceCents / 100).toFixed(0)} ${ad.currency}`;
  const now = firestore.FieldValue.serverTimestamp();
  const ref = await chatThreadsCol().add({
    adId: ad.id,
    buyerUid,
    sellerUid,
    participantIds: participants,
    productTitle: ad.title,
    productThumb: ad.thumbnailUrl,
    priceLabel,
    lastMessageText: '',
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getOrCreateChatThread(input: { ad: Ad; buyerUid: string }): Promise<string> {
  if (requireUid() !== input.buyerUid) {
    throw new Error('You must be signed in as the buyer.');
  }
  return ensureChatThreadForOrder(input.ad, input.buyerUid);
}

export function listenChatThreads(
  onChange: (threads: ChatThread[]) => void,
  onError: (e: Error) => void,
): () => void {
  let uid: string;
  try {
    uid = requireUid();
  } catch (e) {
    onError(e as Error);
    return () => {};
  }
  return chatThreadsCol()
    .where('participantIds', 'array-contains', uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .onSnapshot(
      (snap) => {
        const list: ChatThread[] = snap.docs.map((d) => {
          const data = d.data() as Omit<ChatThread, 'id'>;
          return { id: d.id, ...data };
        });
        onChange(list);
      },
      (err) => onError(err as Error),
    );
}

export function listenThreadMessages(
  threadId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError: (e: Error) => void,
): () => void {
  return threadMessagesCol(threadId)
    .orderBy('createdAt', 'asc')
    .limit(100)
    .onSnapshot(
      (snap) => {
        const list: ChatMessage[] = snap.docs.map((d) => {
          const data = d.data() as Omit<ChatMessage, 'id' | 'threadId'>;
          return { id: d.id, threadId, ...data };
        });
        onChange(list);
      },
      (err) => onError(err as Error),
    );
}

export async function sendChatMessage(threadId: string, text: string, imageUrl?: string | null) {
  const uid = requireUid();
  const trimmed = text.trim();
  if (!trimmed && !imageUrl) return;
  const now = firestore.FieldValue.serverTimestamp();
  const msgRef = threadMessagesCol(threadId).doc();
  const batch = firestore().batch();
  batch.set(msgRef, {
    senderUid: uid,
    text: trimmed || (imageUrl ? ' ' : ''),
    imageUrl: imageUrl ?? null,
    createdAt: now,
  });
  batch.set(
    chatThreadsCol().doc(threadId),
    {
      lastMessageText: trimmed || '📷 Photo',
      lastMessageAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
  await batch.commit();
}

export function priceLabelFromAd(priceCents: number, currency: Currency): string {
  return `${(priceCents / 100).toFixed(0)} ${currency}`;
}
