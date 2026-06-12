import prisma from '../config/prisma.js';

export const chatRepository = {
  findThreadsForUser(userId, limit = 50) {
    return prisma.chatThread.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  findByListingAndBuyer(listingId, buyerId) {
    return prisma.chatThread.findUnique({
      where: { listingId_buyerId: { listingId, buyerId } },
    });
  },

  findById(id) {
    return prisma.chatThread.findUnique({ where: { id } });
  },

  create(data) {
    return prisma.chatThread.create({ data });
  },

  update(id, data) {
    return prisma.chatThread.update({ where: { id }, data });
  },

  findMessages(threadId, { skip = 0, take = 200 }) {
    return prisma.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });
  },

  createMessage(data) {
    return prisma.chatMessage.create({ data });
  },

  addParticipants(threadId, userIds) {
    return prisma.chatThreadParticipant.createMany({
      data: userIds.map((userId) => ({ threadId, userId })),
      skipDuplicates: true,
    });
  },
};
