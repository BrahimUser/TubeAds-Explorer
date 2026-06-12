import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import listingRoutes from './listingRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import chatRoutes from './chatRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import orderRoutes from './orderRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK', data: { status: 'healthy' } });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/listings', listingRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/orders', orderRoutes);
router.use('/uploads', uploadRoutes);

export default router;
