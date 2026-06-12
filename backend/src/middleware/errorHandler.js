import { AppError } from '../utils/AppError.js';
import { error as errorResponse } from '../utils/ApiResponse.js';

export function notFoundHandler(req, res) {
  return errorResponse(res, `Route ${req.method} ${req.originalUrl} not found`, [], 404);
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.errors, err.statusCode);
  }

  if (err.name === 'ValidationError' || err.type === 'entity.parse.failed') {
    return errorResponse(res, 'Validation failed', [err.message], 400);
  }

  if (err.code === 'P2002') {
    return errorResponse(res, 'Duplicate entry', [], 409);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 'Resource not found', [], 404);
  }

  console.error('[error]', err);
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    [],
    500,
  );
}
