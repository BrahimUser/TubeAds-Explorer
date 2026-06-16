import { Prisma } from '@prisma/client';
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

  searchFulltext({ booleanQuery, limit }) {
    if (!booleanQuery) return Promise.resolve([]);
    return prisma.$queryRaw`
      SELECT
        l.id,
        l.title,
        l.category,
        l.city,
        l.price_cents AS priceCents,
        l.currency,
        l.thumbnail_url AS thumbnailUrl,
        l.created_at AS createdAt,
        MATCH(l.title, l.category, l.description) AGAINST (${booleanQuery} IN BOOLEAN MODE) AS ftScore
      FROM listings l
      WHERE l.status = 'APPROVED'
        AND MATCH(l.title, l.category, l.description) AGAINST (${booleanQuery} IN BOOLEAN MODE)
      ORDER BY ftScore DESC, l.created_at DESC
      LIMIT ${limit}
    `;
  },

  searchPrefix({ prefix, excludeIds = [], limit }) {
    if (!prefix || limit <= 0) return Promise.resolve([]);
    const pattern = `${prefix}%`;
    if (excludeIds.length === 0) {
      return prisma.$queryRaw`
        SELECT
          l.id,
          l.title,
          l.category,
          l.city,
          l.price_cents AS priceCents,
          l.currency,
          l.thumbnail_url AS thumbnailUrl,
          l.created_at AS createdAt,
          0 AS ftScore
        FROM listings l
        WHERE l.status = 'APPROVED'
          AND (l.title LIKE ${pattern} OR l.category LIKE ${pattern})
        ORDER BY l.created_at DESC
        LIMIT ${limit}
      `;
    }
    return prisma.$queryRaw`
      SELECT
        l.id,
        l.title,
        l.category,
        l.city,
        l.price_cents AS priceCents,
        l.currency,
        l.thumbnail_url AS thumbnailUrl,
        l.created_at AS createdAt,
        0 AS ftScore
      FROM listings l
      WHERE l.status = 'APPROVED'
        AND l.id NOT IN (${Prisma.join(excludeIds)})
        AND (l.title LIKE ${pattern} OR l.category LIKE ${pattern})
      ORDER BY l.created_at DESC
      LIMIT ${limit}
    `;
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
