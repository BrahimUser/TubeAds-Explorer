import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator,
  loginValidator,
  refreshValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post('/register', authRateLimit, registerValidator, validate, asyncHandler(authController.register));
router.post('/login', authRateLimit, loginValidator, validate, asyncHandler(authController.login));
router.post('/logout', refreshValidator, validate, asyncHandler(authController.logout));
router.post('/refresh', authRateLimit, refreshValidator, validate, asyncHandler(authController.refresh));
router.get('/me', authenticate, asyncHandler(authController.me));

export default router;
