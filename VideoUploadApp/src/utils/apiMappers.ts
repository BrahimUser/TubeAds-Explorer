import type { OrderStatus, DeliveryMethod, PaymentMethod } from '../types/Commerce';

export function apiDateToMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function formatApiDateLabel(value: string | null | undefined): string {
  const ms = apiDateToMs(value);
  if (ms == null) return '—';
  try {
    return new Date(ms).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/** Map API order status to mobile UI labels. */
export function apiStatusToOrderStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? '').trim().toLowerCase();
  const map: Record<string, OrderStatus> = {
    pending: 'Pending',
    confirmed: 'In Progress',
    preparing: 'In Progress',
    shipping: 'In Progress',
    shipped: 'Completed',
    delivered: 'Completed',
    cancelled: 'Cancelled',
    'in progress': 'In Progress',
    completed: 'Completed',
  };
  return map[s] ?? 'Pending';
}

export function orderStatusToSellerAction(
  status: OrderStatus,
): 'confirm' | 'mark_shipped' | null {
  if (status === 'Pending') return 'confirm';
  if (status === 'In Progress') return 'mark_shipped';
  return null;
}

export function deliveryMethodToApi(method: DeliveryMethod): string {
  return method === 'hand' ? 'pickup' : 'home';
}

export function paymentMethodToApi(method: PaymentMethod): string {
  return method === 'online' ? 'card' : 'cash';
}

export function apiDeliveryMethodToUi(raw: unknown): DeliveryMethod {
  const s = String(raw ?? '').toLowerCase();
  return s === 'pickup' || s === 'hand' ? 'hand' : 'home';
}

export function apiPaymentMethodToUi(raw: unknown): PaymentMethod {
  const s = String(raw ?? '').toLowerCase();
  return s === 'card' || s === 'online' ? 'online' : 'cash';
}
