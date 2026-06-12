import prisma from '../config/prisma.js';

export const authRepository = {
  createRefreshToken(data) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash) {
    return prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  },

  revokeRefreshToken(id) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllUserTokens(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
