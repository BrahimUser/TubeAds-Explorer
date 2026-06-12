import prisma from '../config/prisma.js';

const orderInclude = { delivery: true };

export const orderRepository = {
  create(data) {
    return prisma.order.create({
      data,
      include: orderInclude,
    });
  },

  findById(id) {
    return prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  },

  findByUser(userId, role, { skip = 0, take = 100 } = {}) {
    const where = role === 'seller' ? { sellerId: userId } : { buyerId: userId };
    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: orderInclude,
    });
  },

  update(id, data) {
    return prisma.order.update({
      where: { id },
      data,
      include: orderInclude,
    });
  },
};
