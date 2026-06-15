// Orders via Express API (replaces Firestore `orders` collection).
import api, { getAccessToken, silentRequest, unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';

const STATUS_FALLBACK = {
  pending: 'pending',
  confirmed: 'confirmed',
  shipped: 'shipped',
  cancelled: 'cancelled',
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
    buyerUid: String(raw.buyerUid ?? raw.buyerId ?? ''),
    sellerUid: String(raw.sellerUid ?? raw.sellerId ?? ''),
    adId: String(raw.adId ?? raw.listingId ?? ''),
    adTitle: String(raw.adTitle ?? raw.listingTitle ?? ''),
    adThumbnailUrl: String(raw.adThumbnailUrl ?? raw.listingThumbnailUrl ?? ''),
    priceCents,
    currency: raw.currency || 'MAD',
    delivery: raw.delivery || { fullName: '', phone: '', address: '', city: '', zip: '' },
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

function requireAuth() {
  if (!getAccessToken()) throw new Error('You must be signed in.');
}

export async function placeOrder(input) {
  requireAuth();
  if (!input || typeof input !== 'object') throw new Error('Missing order data.');
  const listingId = input.adId || input.listingId;
  const sellerUid = input.sellerUid || input.sellerId;
  if (!listingId) throw new Error('Missing listing.');
  if (!sellerUid) throw new Error('Missing seller.');

  const res = await api.post('/orders', {
    listingId,
    sellerUid,
    adTitle: input.adTitle,
    adThumbnailUrl: input.adThumbnailUrl,
    subtotalCents: input.subtotalCents ?? input.priceCents,
    shippingFeeCents: input.shippingFeeCents,
    currency: input.currency,
    delivery: input.delivery,
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
  });
  const { order } = unwrap(res);
  return { id: order.id, orderNumber: order.orderNumber };
}

export function listenSellerOrders(uid, onChange, onError) {
  if (!uid) {
    onChange([]);
    return () => {};
  }
  return createPoller(
    async () => {
      const res = await api.get('/orders', { ...silentRequest, params: { role: 'seller' } });
      const { orders } = unwrap(res);
      return (orders || []).map((o) => parseOrder(o.id, o));
    },
    onChange,
    onError,
    10000,
  );
}

export function listenBuyerOrders(uid, onChange, onError) {
  if (!uid) {
    onChange([]);
    return () => {};
  }
  return createPoller(
    async () => {
      const res = await api.get('/orders', { ...silentRequest, params: { role: 'buyer' } });
      const { orders } = unwrap(res);
      return (orders || []).map((o) => parseOrder(o.id, o));
    },
    onChange,
    onError,
    10000,
  );
}

export async function sellerAdvanceOrder(order, action) {
  requireAuth();
  const apiAction = action === 'mark_shipped' ? 'ship' : action;
  await api.patch(`/orders/${order.id}/status`, { action: apiAction });
}

export async function sellerCancelOrder(order) {
  requireAuth();
  await api.patch(`/orders/${order.id}/status`, { action: 'cancel' });
}
