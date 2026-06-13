import { chatRepository } from '../repositories/chatRepository.js';
import { listingRepository } from '../repositories/listingRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { emitNewMessage, emitThreadCreated } from '../socket/chatEvents.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/AppError.js';
import { mapChatThread, mapChatMessage } from '../utils/mappers.js';

export const chatService = {
  async listThreads(userId) {
    const threads = await chatRepository.findThreadsForUser(userId);
    return threads.map(mapChatThread);
  },

  async getOrCreateThread(userId, listingId) {
    const listing = await listingRepository.findById(listingId);
    if (!listing) throw new NotFoundError('Listing not found');
    if (!listing.ownerId) throw new ValidationError('This listing has no seller.');
    if (listing.ownerId === userId) {
      throw new ValidationError('You cannot message yourself on your own listing.');
    }

    const existing = await chatRepository.findByListingAndBuyer(listingId, userId);
    if (existing) return mapChatThread(existing);

    const priceLabel = `${Math.round(listing.priceCents / 100)} ${listing.currency || 'MAD'}`;
    const thread = await chatRepository.create({
      listingId,
      buyerId: userId,
      sellerId: listing.ownerId,
      productTitle: listing.title || '',
      productThumb: listing.thumbnailUrl || '',
      priceLabel,
      participants: {
        create: [
          { userId },
          { userId: listing.ownerId },
        ],
      },
    });
    emitThreadCreated(thread);
    return mapChatThread(thread);
  },

  async getMessages(threadId, userId, query = {}) {
    const thread = await chatRepository.findById(threadId);
    if (!thread) throw new NotFoundError('Thread not found');
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      throw new AuthorizationError('Not a participant in this thread');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 200));
    const skip = (page - 1) * limit;

    const messages = await chatRepository.findMessages(threadId, { skip, take: limit });
    return messages.map(mapChatMessage);
  },

  async sendMessage(threadId, userId, { text, imageUrl, listingId, recipientId, senderName }) {
    const thread = await chatRepository.findById(threadId);
    if (!thread) throw new NotFoundError('Thread not found');
    if (thread.buyerId !== userId && thread.sellerId !== userId) {
      throw new AuthorizationError('Not a participant in this thread');
    }

    const trimmed = (text || '').trim();
    if (!trimmed && !imageUrl) return null;

    const message = await chatRepository.createMessage({
      threadId,
      senderId: userId,
      text: trimmed || (imageUrl ? ' ' : ''),
      imageUrl: imageUrl || null,
      listingId: listingId || thread.listingId,
    });

    const updatedThread = await chatRepository.update(threadId, {
      lastMessageText: trimmed || '📷 Photo',
      lastMessageAt: new Date(),
    });

    const otherId = recipientId || (thread.buyerId === userId ? thread.sellerId : thread.buyerId);
    if (otherId && otherId !== userId) {
      const sender = await userRepository.findById(userId);
      const name = senderName || sender?.displayName || sender?.shopName || 'Utilisateur';
      await notificationRepository.create({
        recipientId: otherId,
        senderName: name,
        message: trimmed || '📷 Photo',
        type: 'new_message',
        link: { type: 'chat', threadId, listingId: thread.listingId },
      });
    }

    const mappedMessage = mapChatMessage(message);
    emitNewMessage(mappedMessage, updatedThread);
    return mappedMessage;
  },
};
