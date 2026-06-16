import type { Ad, Currency } from '../types/Ad';
import type {
  ChatMessage,
  ChatThread,
  DeliveryMethod,
  Order,
  OrderStatus,
  PaymentMethod,
} from '../types/Commerce';
import api, { getAccessToken, silentRequest, unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';
import {
  apiDeliveryMethodToUi,
  apiPaymentMethodToUi,
  apiStatusToOrderStatus,
  deliveryMethodToApi,
  paymentMethodToApi,
} from '../utils/apiMappers';

function parseOrder(id: string, raw: Record<string, unknown>): Order {
  const priceCents = Number(raw.priceCents) || 0;
  const subtotalCents = Number(raw.subtotalCents ?? raw.priceCents) || priceCents;
  const shippingFeeCents = Number(raw.shippingFeeCents ?? 0) || 0;
  const totalCents = Number(raw.totalCents ?? subtotalCents + shippingFeeCents);
  const delivery = (raw.delivery as Order['delivery']) ?? {
    fullName: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
  };
  return {
    id,
    buyerUid: String(raw.buyerUid ?? raw.buyerId ?? ''),
    sellerUid: String(raw.sellerUid ?? raw.sellerId ?? ''),
    adId: String(raw.adId ?? raw.listingId ?? ''),
    adTitle: String(raw.adTitle ?? raw.listingTitle ?? ''),
    adThumbnailUrl: String(raw.adThumbnailUrl ?? raw.listingThumbnailUrl ?? ''),
    priceCents,
    currency: (raw.currency as Currency) ?? 'MAD',
    delivery,
    deliveryMethod: apiDeliveryMethodToUi(raw.deliveryMethod),
    paymentMethod: apiPaymentMethodToUi(raw.paymentMethod),
    status: apiStatusToOrderStatus(raw.status),
    orderNumber: String(raw.orderNumber ?? `ORD-${id.slice(-6).toUpperCase()}`),
    subtotalCents,
    shippingFeeCents,
    totalCents,
    createdAt: (raw.createdAt as string | null) ?? null,
    updatedAt: (raw.updatedAt as string | null) ?? null,
  };
}

export function normalizeOrderStatus(raw: unknown): OrderStatus {
  return apiStatusToOrderStatus(raw);
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

async function requireAuth(): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('You must be signed in.');
}

export async function createOrderFromCheckout(input: {
  ad: Ad;
  delivery: Order['delivery'];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
}): Promise<string> {
  await requireAuth();
  const res = await api.post('/orders', {
    listingId: input.ad.id,
    sellerUid: input.ad.ownerUid,
    adTitle: input.ad.title,
    adThumbnailUrl: input.ad.thumbnailUrl,
    subtotalCents: input.ad.priceCents,
    shippingFeeCents: 0,
    currency: input.ad.currency,
    delivery: input.delivery,
    deliveryMethod: deliveryMethodToApi(input.deliveryMethod),
    paymentMethod: paymentMethodToApi(input.paymentMethod),
  });
  const data = unwrap<{ order: { id: string } }>(res);
  return data.order.id;
}

export function listenBuyerOrders(
  onChange: (orders: Order[]) => void,
  onError: (e: Error) => void,
): () => void {
  return createPoller(
    async () => {
      await requireAuth();
      const res = await api.get('/orders', { ...silentRequest, params: { role: 'buyer' } });
      const data = unwrap<{ orders: Record<string, unknown>[] }>(res);
      return (data.orders || []).map((o) => parseOrder(String(o.id), o));
    },
    onChange,
    onError,
    10000,
  );
}

export function listenSellerOrders(
  onChange: (orders: Order[]) => void,
  onError: (e: Error) => void,
): () => void {
  return createPoller(
    async () => {
      await requireAuth();
      const res = await api.get('/orders', { ...silentRequest, params: { role: 'seller' } });
      const data = unwrap<{ orders: Record<string, unknown>[] }>(res);
      return (data.orders || []).map((o) => parseOrder(String(o.id), o));
    },
    onChange,
    onError,
    10000,
  );
}

export async function getOrder(orderId: string): Promise<Order | null> {
  await requireAuth();
  const res = await api.get(`/orders/${orderId}`);
  const data = unwrap<{ order: Record<string, unknown> | null }>(res);
  if (!data.order) return null;
  return parseOrder(String(data.order.id), data.order);
}

export async function sellerAdvanceOrder(
  orderId: string,
  action: 'confirm' | 'mark_shipped',
): Promise<void> {
  await requireAuth();
  const apiAction = action === 'mark_shipped' ? 'ship' : action;
  await api.patch(`/orders/${orderId}/status`, { action: apiAction });
}

export function priceLabelFromAd(priceCents: number, currency: Currency): string {
  return `${(priceCents / 100).toFixed(0)} ${currency}`;
}
