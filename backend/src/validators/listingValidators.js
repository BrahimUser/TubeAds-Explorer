import { body, param, query } from 'express-validator';

export const searchListingsValidator = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Search query must be between 3 and 100 characters'),
  query('limit').optional().isInt({ min: 1, max: 10 }),
];

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
