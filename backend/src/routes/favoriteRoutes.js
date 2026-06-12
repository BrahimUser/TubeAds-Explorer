import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(favoriteController.list));
router.post('/', asyncHandler(favoriteController.add));
router.delete('/:listingId', asyncHandler(favoriteController.remove));

export default router;
