import bcrypt from 'bcrypt';
import { authRepository } from '../repositories/authRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { ValidationError, AuthenticationError } from '../utils/AppError.js';
import { validateMoroccoPhone } from '../utils/phone.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshExpiry,
} from '../utils/jwt.js';
import { mapUser } from '../utils/mappers.js';

const SALT_ROUNDS = 12;

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await authRepository.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiry(),
  });
  return { accessToken, refreshToken };
}

export const authService = {
  async register({ phone, password }) {
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters.');
    }
    const phoneNumber = validateMoroccoPhone(phone);
    const existing = await userRepository.findByPhone(phoneNumber);
    if (existing) {
      throw new ValidationError('This phone number is already registered.');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({
      phoneNumber,
      passwordHash,
      displayName: phoneNumber,
      authProvider: 'phone_password',
    });

    const tokens = await issueTokens(user);
    return { user: mapUser(user), ...tokens };
  },

  async login({ phone, password }) {
    if (!password) throw new ValidationError('Please enter your password.');
    const phoneNumber = validateMoroccoPhone(phone);
    const user = await userRepository.findByPhone(phoneNumber);
    if (!user) {
      throw new AuthenticationError('Wrong phone number or password.');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError('Wrong phone number or password.');
    }

    const tokens = await issueTokens(user);
    return { user: mapUser(user), ...tokens };
  },

  async logout(refreshToken) {
    if (!refreshToken) return;
    try {
      const payload = verifyRefreshToken(refreshToken);
      const record = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));
      if (record) await authRepository.revokeRefreshToken(record.id);
      if (payload?.sub) {
        await authRepository.revokeAllUserTokens(payload.sub);
      }
    } catch {
      // best-effort logout
    }
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw new AuthenticationError('Refresh token required');
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const record = await authRepository.findRefreshTokenByHash(hashToken(refreshToken));
    if (!record || record.userId !== payload.sub) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    await authRepository.revokeRefreshToken(record.id);
    const tokens = await issueTokens(record.user);
    return { user: mapUser(record.user), ...tokens };
  },

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AuthenticationError('User not found');
    return mapUser(user);
  },
};
