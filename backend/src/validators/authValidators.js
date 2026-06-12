import { body } from 'express-validator';

export const registerValidator = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginValidator = [
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
