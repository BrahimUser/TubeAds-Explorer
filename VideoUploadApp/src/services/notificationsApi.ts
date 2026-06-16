import api, { getAccessToken, silentRequest, unwrap } from '../api/client';
import type { NotificationItem } from '../data/mockNotifications';
import { apiDateToMs } from '../utils/apiMappers';

function mapNotification(raw: Record<string, unknown>): NotificationItem {
  const type = String(raw.type ?? '').toLowerCase();
  const kind: NotificationItem['kind'] =
    type.includes('order') || type.includes('ORDER') ? 'order' : 'message';
  return {
    id: String(raw.id ?? ''),
    kind,
    senderName: String(raw.senderName ?? ''),
    orderId: kind === 'order' ? String(raw.link ?? raw.message ?? '').slice(0, 32) : undefined,
    preview: String(raw.message ?? ''),
    createdAtMs: apiDateToMs(raw.createdAt as string | null) ?? Date.now(),
    read: Boolean(raw.isRead),
  };
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;
  const res = await api.get('/notifications/unread-count', silentRequest);
  const data = unwrap<{ count: number }>(res);
  return data.count || 0;
}

export async function fetchRecentNotifications(): Promise<NotificationItem[]> {
  const token = await getAccessToken();
  if (!token) return [];
  const res = await api.get('/notifications', silentRequest);
  const data = unwrap<{ notifications: Record<string, unknown>[] }>(res);
  return (data.notifications || []).map((n) => mapNotification(n));
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token || !notificationId) return;
  await api.patch(`/notifications/${notificationId}/read`);
}
