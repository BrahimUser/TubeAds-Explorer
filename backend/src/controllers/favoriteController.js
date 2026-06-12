import { favoriteService } from '../services/favoriteService.js';
import { success } from '../utils/ApiResponse.js';

export const favoriteController = {
  async list(req, res) {
    const favorites = await favoriteService.list(req.user.id);
    return success(res, { favorites, ids: favorites.map((f) => f.listingId) });
  },

  async add(req, res) {
    const listingId = req.body.listingId || req.body.adId;
    const favorite = await favoriteService.add(req.user.id, listingId);
    return success(res, { favorite }, 'Added to favorites', 201);
  },

  async remove(req, res) {
    const listingId = req.params.listingId || req.params.adId;
    await favoriteService.remove(req.user.id, listingId);
    return success(res, {}, 'Removed from favorites');
  },
};
