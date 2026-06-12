import prisma from '../config/prisma.js';
import { AuthenticationError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AuthenticationError('Access token required');

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new AuthenticationError('User not found');

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(new AuthenticationError('Invalid or expired token'));
    }
    next(err);
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    prisma.user.findUnique({ where: { id: payload.sub } }).then((user) => {
      if (user) {
        req.user = user;
        req.tokenPayload = payload;
      }
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}
