import { notificationRepository } from '../repositories/notificationRepository.js';
import { AuthorizationError, NotFoundError } from '../utils/AppError.js';
import { mapNotification } from '../utils/mappers.js';

export const notificationService = {
  async listRecent(userId, limit = 12) {
    const items = await notificationRepository.findRecent(userId, limit);
    return items.map(mapNotification);
  },

  async unreadCount(userId) {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  },

  async markRead(userId, notificationId) {
    const n = await notificationRepository.findById(notificationId);
    if (!n) throw new NotFoundError('Notification not found');
    if (n.recipientId !== userId) {
      throw new AuthorizationError('Cannot mark another user\'s notification');
    }
    const updated = await notificationRepository.markRead(notificationId, userId);
    return mapNotification(updated);
  },
};
