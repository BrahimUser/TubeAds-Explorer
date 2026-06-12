import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn },
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshExpiry() {
  const match = String(env.jwt.refreshExpiresIn).match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [, num, unit] = match;
  const n = Number(num);
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return new Date(Date.now() + n * (multipliers[unit] || 86400000));
}
