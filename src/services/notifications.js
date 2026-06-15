import api, { getAccessToken, silentRequest, unwrap } from '../api/client';

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

export async function fetchUnreadNotificationsCount() {
  if (!getAccessToken()) return 0;
  const res = await api.get('/notifications/unread-count', silentRequest);
  const data = unwrap(res);
  return data.count || 0;
}

export async function fetchRecentNotifications() {
  const res = await api.get('/notifications', silentRequest);
  const { notifications } = unwrap(res);
  return notifications || [];
}

export async function markNotificationRead(notificationId) {
  if (!getAccessToken()) return;
  if (!notificationId) return;
  await api.patch(`/notifications/${notificationId}/read`);
}
