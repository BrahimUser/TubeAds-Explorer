import { body, param, query } from 'express-validator';

export const createThreadValidator = [
  body('listingId').isUUID().withMessage('listingId is required'),
];

export const threadIdValidator = [
  param('id').isUUID(),
];

export const sendMessageValidator = [
  param('id').isUUID(),
  body('text').optional().isString(),
  body('imageUrl').optional().isURL(),
];

export const messagesQueryValidator = [
  param('id').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
];
