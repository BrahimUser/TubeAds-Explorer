import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/AppError.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    throw new ValidationError('Validation failed', errors);
  }
  next();
}
