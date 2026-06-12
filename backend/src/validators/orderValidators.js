import { body, param, query } from 'express-validator';

export const placeOrderValidator = [
  body('listingId').optional().isUUID(),
  body('adId').optional().isUUID(),
  body('sellerUid').optional().isUUID(),
  body('sellerId').optional().isUUID(),
  body('subtotalCents').optional().isInt({ min: 0 }),
  body('shippingFeeCents').optional().isInt({ min: 0 }),
];

export const orderIdValidator = [
  param('id').isUUID(),
];

export const orderListValidator = [
  query('role').optional().isIn(['buyer', 'seller']),
];

export const orderStatusValidator = [
  param('id').isUUID(),
  body('action').isIn(['confirm', 'mark_shipped', 'ship', 'cancel']),
];
