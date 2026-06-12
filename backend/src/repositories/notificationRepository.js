import prisma from '../config/prisma.js';

export const notificationRepository = {
  create(data) {
    return prisma.notification.create({ data });
  },

  findRecent(recipientId, limit = 12) {
    return prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  countUnread(recipientId) {
    return prisma.notification.count({
      where: { recipientId, isRead: false },
    });
  },

  markRead(id, readById) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date(), readById },
    });
  },

  findById(id) {
    return prisma.notification.findUnique({ where: { id } });
  },
};
