import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.put('/me', authenticate, asyncHandler(userController.updateMe));
router.get('/:id', asyncHandler(userController.getById));

export default router;
