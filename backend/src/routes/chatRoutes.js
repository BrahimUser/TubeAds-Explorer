import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createThreadValidator,
  threadIdValidator,
  sendMessageValidator,
  messagesQueryValidator,
} from '../validators/chatValidators.js';

const router = Router();

router.use(authenticate);

router.get('/threads', asyncHandler(chatController.listThreads));
router.post('/threads', createThreadValidator, validate, asyncHandler(chatController.getOrCreateThread));
router.get('/threads/:id/messages', messagesQueryValidator, validate, asyncHandler(chatController.getMessages));
router.post('/threads/:id/messages', sendMessageValidator, validate, asyncHandler(chatController.sendMessage));

export default router;
