import { body, param, query } from 'express-validator';

export const listListingsValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 120 }),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'active', 'PENDING', 'APPROVED', 'REJECTED', 'ACTIVE']),
  query('ownerId').optional().isUUID(),
  query('search').optional().isString(),
];

export const listingIdValidator = [
  param('id').isUUID().withMessage('Invalid listing id'),
];

export const createListingValidator = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('priceCents').optional().isInt({ min: 0 }),
  body('currency').optional().isString(),
];

export const updateListingValidator = [
  param('id').isUUID(),
  body('title').optional().trim().notEmpty(),
  body('priceCents').optional().isInt({ min: 0 }),
];
