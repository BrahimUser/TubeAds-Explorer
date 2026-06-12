import { chatService } from '../services/chatService.js';
import { success } from '../utils/ApiResponse.js';

export const chatController = {
  async listThreads(req, res) {
    const threads = await chatService.listThreads(req.user.id);
    return success(res, { threads });
  },

  async getOrCreateThread(req, res) {
    const thread = await chatService.getOrCreateThread(
      req.user.id,
      req.body.listingId,
    );
    return success(res, { thread }, 'Thread ready', 201);
  },

  async getMessages(req, res) {
    const messages = await chatService.getMessages(
      req.params.id,
      req.user.id,
      req.query,
    );
    return success(res, { messages });
  },

  async sendMessage(req, res) {
    const otherId = req.body.recipientId;
    const message = await chatService.sendMessage(req.params.id, req.user.id, {
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      listingId: req.body.listingId,
      recipientId: otherId,
      senderName: req.body.senderName,
    });
    return success(res, { message }, 'Message sent', 201);
  },
};
