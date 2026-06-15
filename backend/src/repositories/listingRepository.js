import prisma from '../config/prisma.js';

const listingInclude = {
  images: { orderBy: { sortOrder: 'asc' } },
  owner: {
    select: {
      id: true,
      displayName: true,
      shopName: true,
      phoneNumber: true,
      isPro: true,
    },
  },
};

export const listingRepository = {
  findMany({ where, skip, take, orderBy }) {
    return prisma.listing.findMany({
      where,
      skip,
      take,
      orderBy: orderBy || { createdAt: 'desc' },
      include: listingInclude,
    });
  },

  count(where) {
    return prisma.listing.count({ where });
  },

  findById(id) {
    return prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });
  },

  create(data) {
    return prisma.listing.create({
      data,
      include: listingInclude,
    });
  },

  update(id, data) {
    return prisma.listing.update({
      where: { id },
      data,
      include: listingInclude,
    });
  },

  delete(id) {
    return prisma.listing.delete({ where: { id } });
  },

  replaceImages(listingId, urls) {
    return prisma.$transaction(async (tx) => {
      await tx.listingImage.deleteMany({ where: { listingId } });
      if (urls?.length) {
        await tx.listingImage.createMany({
          data: urls.map((url, i) => ({
            listingId,
            url,
            sortOrder: i,
          })),
        });
      }
      return tx.listing.findUnique({
        where: { id: listingId },
        include: listingInclude,
      });
    });
  },
};
