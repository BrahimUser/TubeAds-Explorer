import { notificationService } from '../services/notificationService.js';
import { success } from '../utils/ApiResponse.js';

export const notificationController = {
  async list(req, res) {
    const notifications = await notificationService.listRecent(req.user.id);
    return success(res, { notifications });
  },

  async unreadCount(req, res) {
    const result = await notificationService.unreadCount(req.user.id);
    return success(res, result);
  },

  async markRead(req, res) {
    const notification = await notificationService.markRead(req.user.id, req.params.id);
    return success(res, { notification }, 'Notification marked as read');
  },
};
