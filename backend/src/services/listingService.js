import { listingRepository } from '../repositories/listingRepository.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { mapListing } from '../utils/mappers.js';

function buildWhere(query) {
  const where = {};
  if (query.status) {
    where.status = query.status.toUpperCase();
  }
  if (query.category) where.category = query.category;
  if (query.city) where.city = query.city;
  if (query.ownerId) where.ownerId = query.ownerId;
  if (query.search) {
    where.title = { contains: query.search };
  }
  return where;
}

export const listingService = {
  async list(query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(120, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const where = buildWhere(query);

    const [items, total] = await Promise.all([
      listingRepository.findMany({ where, skip, take: limit }),
      listingRepository.count(where),
    ]);

    return {
      items: items.map(mapListing),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id) {
    const listing = await listingRepository.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');
    return mapListing(listing);
  },

  async create(ownerId, body) {
    const listing = await listingRepository.create({
      ownerId,
      title: body.title,
      description: body.description || '',
      priceCents: body.priceCents || 0,
      currency: body.currency || 'MAD',
      category: body.category || '',
      city: body.city || '',
      youtubeVideoId: body.youtubeVideoId || '',
      videoUrl: body.videoUrl || '',
      thumbnailUrl: body.thumbnailUrl || '',
      status: 'PENDING',
      viewCount: body.viewCount ?? null,
      images: body.imageUrls?.length
        ? { create: body.imageUrls.map((url, i) => ({ url, sortOrder: i })) }
        : undefined,
    });
    return mapListing(listing);
  },

  async update(id, userId, userRole, body) {
    const listing = await listingRepository.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');
    if (listing.ownerId !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('You can only edit your own listing.');
    }

    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.priceCents !== undefined) patch.priceCents = body.priceCents;
    if (body.currency !== undefined) patch.currency = body.currency;
    if (body.category !== undefined) patch.category = body.category;
    if (body.city !== undefined) patch.city = body.city;
    if (body.youtubeVideoId !== undefined) patch.youtubeVideoId = body.youtubeVideoId;
    if (body.videoUrl !== undefined) patch.videoUrl = body.videoUrl;
    if (body.thumbnailUrl !== undefined) patch.thumbnailUrl = body.thumbnailUrl;
    if (body.viewCount !== undefined) patch.viewCount = body.viewCount;

    // Moderation: owner edits reset to pending
    if (listing.ownerId === userId && userRole !== 'ADMIN') {
      patch.status = 'PENDING';
    }

    let updated = await listingRepository.update(id, patch);
    if (body.imageUrls) {
      updated = await listingRepository.replaceImages(id, body.imageUrls);
    }
    return mapListing(updated);
  },

  async delete(id, userId, userRole) {
    const listing = await listingRepository.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');
    if (listing.ownerId !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('You can only delete your own listing.');
    }
    await listingRepository.delete(id);
  },

  async approve(id) {
    const listing = await listingRepository.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');
    const updated = await listingRepository.update(id, { status: 'APPROVED' });
    return mapListing(updated);
  },

  async reject(id) {
    const listing = await listingRepository.findById(id);
    if (!listing) throw new NotFoundError('Listing not found');
    const updated = await listingRepository.update(id, { status: 'REJECTED' });
    return mapListing(updated);
  },
};
