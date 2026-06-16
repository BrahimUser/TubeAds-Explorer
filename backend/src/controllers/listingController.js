import { listingService } from '../services/listingService.js';
import { searchService } from '../services/searchService.js';
import { success } from '../utils/ApiResponse.js';

export const listingController = {
  async search(req, res) {
    const result = await searchService.search(req.query);
    return success(res, result);
  },

  async list(req, res) {
    const result = await listingService.list(req.query);
    return success(res, result);
  },

  async getById(req, res) {
    const listing = await listingService.getById(req.params.id);
    return success(res, { listing });
  },

  async create(req, res) {
    const listing = await listingService.create(req.user.id, req.body);
    return success(res, { listing }, 'Listing created', 201);
  },

  async update(req, res) {
    const listing = await listingService.update(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body,
    );
    return success(res, { listing }, 'Listing updated');
  },

  async remove(req, res) {
    await listingService.delete(req.params.id, req.user.id, req.user.role);
    return success(res, {}, 'Listing deleted');
  },

  async approve(req, res) {
    const listing = await listingService.approve(req.params.id);
    return success(res, { listing }, 'Listing approved');
  },

  async reject(req, res) {
    const listing = await listingService.reject(req.params.id);
    return success(res, { listing }, 'Listing rejected');
  },
};
