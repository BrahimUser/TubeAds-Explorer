import prisma from '../config/prisma.js';

export const uploadRepository = {
  create(data) {
    return prisma.upload.create({ data });
  },

  findById(id) {
    return prisma.upload.findUnique({ where: { id } });
  },

  delete(id) {
    return prisma.upload.delete({ where: { id } });
  },
};
