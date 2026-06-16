import { Router } from 'express';
import { listingController } from '../controllers/listingController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  listListingsValidator,
  searchListingsValidator,
  listingIdValidator,
  createListingValidator,
  updateListingValidator,
} from '../validators/listingValidators.js';

const router = Router();

router.get('/search', searchListingsValidator, validate, asyncHandler(listingController.search));
router.get('/', listListingsValidator, validate, asyncHandler(listingController.list));
router.get('/:id', listingIdValidator, validate, asyncHandler(listingController.getById));
router.post('/', authenticate, createListingValidator, validate, asyncHandler(listingController.create));
router.put('/:id', authenticate, updateListingValidator, validate, asyncHandler(listingController.update));
router.delete('/:id', authenticate, listingIdValidator, validate, asyncHandler(listingController.remove));
router.post('/:id/approve', authenticate, authorize('ADMIN'), listingIdValidator, validate, asyncHandler(listingController.approve));
router.post('/:id/reject', authenticate, authorize('ADMIN'), listingIdValidator, validate, asyncHandler(listingController.reject));

export default router;
