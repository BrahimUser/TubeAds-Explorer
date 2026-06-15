import api, { getAccessToken, silentRequest, unwrap } from '../api/client';
import { createPoller } from '../hooks/usePolling';

export function buildSenderName(user) {
  if (!user) return '';
  const d = String(user.displayName || '').trim();
  if (d) return d;
  const phone = String(user.phoneNumber || '').trim();
  if (phone) return phone;
  return 'Utilisateur';
}

export async function createNotification(input) {
  // Notifications are created server-side on chat/order events.
  console.warn('createNotification: handled by backend', input);
}

export function listenUnreadNotificationsCount(uid, onCount, onError) {
  if (!uid) {
    onCount?.(0);
    return () => {};
  }
  return createPoller(
    async () => {
      if (!getAccessToken()) return 0;
      const res = await api.get('/notifications/unread-count', silentRequest);
      const data = unwrap(res);
      return data.count || 0;
    },
    (count) => onCount?.(count),
    onError,
    15000,
  );
}

export function listenRecentNotifications(uid, onChange, onError) {
  if (!uid) {
    onChange?.([]);
    return () => {};
  }
  return createPoller(
    async () => {
      const res = await api.get('/notifications', silentRequest);
      const { notifications } = unwrap(res);
      return notifications || [];
    },
    onChange,
    onError,
    15000,
  );
}

export async function markNotificationRead(notificationId) {
  if (!getAccessToken()) return;
  if (!notificationId) return;
  await api.patch(`/notifications/${notificationId}/read`);
}
