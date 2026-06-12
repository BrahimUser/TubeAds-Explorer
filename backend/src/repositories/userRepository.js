import prisma from '../config/prisma.js';

export const userRepository = {
  findById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  findByPhone(phoneNumber) {
    return prisma.user.findUnique({ where: { phoneNumber } });
  },

  create(data) {
    return prisma.user.create({ data });
  },

  update(id, data) {
    return prisma.user.update({ where: { id }, data });
  },
};
