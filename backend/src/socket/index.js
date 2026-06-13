import { Server } from 'socket.io';
import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { chatRepository } from '../repositories/chatRepository.js';
import { AuthorizationError } from '../utils/AppError.js';

/** @type {import('socket.io').Server | null} */
let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const raw = socket.handshake.auth?.token
        || socket.handshake.headers?.authorization;
      const token = raw?.startsWith('Bearer ') ? raw.slice(7) : raw;
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('chat:join_thread', async (threadId, ack) => {
      try {
        if (!threadId) throw new Error('Thread id required');
        const thread = await chatRepository.findById(threadId);
        if (!thread) throw new Error('Thread not found');
        if (thread.buyerId !== socket.user.id && thread.sellerId !== socket.user.id) {
          throw new AuthorizationError('Not a participant in this thread');
        }
        socket.join(`thread:${threadId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, message: err.message || 'Could not join thread' });
      }
    });

    socket.on('chat:leave_thread', (threadId) => {
      if (threadId) socket.leave(`thread:${threadId}`);
    });
  });

  return io;
}

export function getIo() {
  return io;
}
