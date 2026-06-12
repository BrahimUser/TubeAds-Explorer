import prisma from '../config/prisma.js';

export const favoriteRepository = {
  findByUser(userId) {
    return prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  findByUserAndListing(userId, listingId) {
    return prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
  },

  create(data) {
    return prisma.favorite.create({ data });
  },

  delete(userId, listingId) {
    return prisma.favorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
  },
};
