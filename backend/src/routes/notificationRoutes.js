import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(notificationController.list));
router.get('/unread-count', asyncHandler(notificationController.unreadCount));
router.patch('/:id/read', asyncHandler(notificationController.markRead));

export default router;
