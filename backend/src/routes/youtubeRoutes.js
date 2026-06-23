import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import rateLimit from 'express-rate-limit';
import { youtubeController } from '../controllers/youtubeController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { env } from '../config/env.js';

const ALLOWED_VIDEO_EXT = /\.(mp4|webm|mov|avi)$/i;

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: env.youtube.maxVideoMb * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const mimeOk = /^(video\/(mp4|webm|quicktime|x-msvideo))$/i.test(file.mimetype);
    const extOk = ALLOWED_VIDEO_EXT.test(file.originalname);
    if (mimeOk || extOk) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported video format. Use MP4, WebM, or MOV.'));
    }
  },
});

const youtubeUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.nodeEnv === 'development' ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many video uploads. Try again later.', errors: [] },
});

const router = Router();

router.use(authenticate);
router.use(youtubeUploadRateLimit);

router.post('/upload', upload.single('video'), asyncHandler(youtubeController.upload));

export default router;
