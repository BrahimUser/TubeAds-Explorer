import { favoriteRepository } from '../repositories/favoriteRepository.js';
import { listingRepository } from '../repositories/listingRepository.js';
import { NotFoundError } from '../utils/AppError.js';
import { mapFavorite } from '../utils/mappers.js';

export const favoriteService = {
  async list(userId) {
    const favorites = await favoriteRepository.findByUser(userId);
    return favorites.map(mapFavorite);
  },

  async add(userId, listingId) {
    const listing = await listingRepository.findById(listingId);
    if (!listing) throw new NotFoundError('Listing not found');

    const existing = await favoriteRepository.findByUserAndListing(userId, listingId);
    if (existing) return mapFavorite(existing);

    const fav = await favoriteRepository.create({
      userId,
      listingId,
      title: listing.title,
      priceCents: listing.priceCents,
      currency: listing.currency,
      thumbnailUrl: listing.thumbnailUrl,
      city: listing.city,
      ownerId: listing.ownerId,
    });
    return mapFavorite(fav);
  },

  async remove(userId, listingId) {
    const existing = await favoriteRepository.findByUserAndListing(userId, listingId);
    if (!existing) throw new NotFoundError('Favorite not found');
    await favoriteRepository.delete(userId, listingId);
  },
};
