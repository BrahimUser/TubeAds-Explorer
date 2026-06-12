import { AuthorizationError } from '../utils/AppError.js';

export function authorize(...roles) {
  const normalized = roles.map((r) => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user) return next(new AuthorizationError());
    if (!normalized.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }
    next();
  };
}
