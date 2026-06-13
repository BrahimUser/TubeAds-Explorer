import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'development' ? 10_000 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'development',
  message: { success: false, message: 'Too many requests', errors: [] },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts', errors: [] },
});
