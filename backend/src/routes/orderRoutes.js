import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  placeOrderValidator,
  orderIdValidator,
  orderListValidator,
  orderStatusValidator,
} from '../validators/orderValidators.js';

const router = Router();

router.use(authenticate);

router.post('/', placeOrderValidator, validate, asyncHandler(orderController.place));
router.get('/', orderListValidator, validate, asyncHandler(orderController.list));
router.get('/:id', orderIdValidator, validate, asyncHandler(orderController.getById));
router.patch('/:id/status', orderStatusValidator, validate, asyncHandler(orderController.updateStatus));

export default router;
