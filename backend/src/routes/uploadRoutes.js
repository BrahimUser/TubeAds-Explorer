import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import { uploadController } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { env } from '../config/env.js';

const tmpDir = os.tmpdir();
const upload = multer({
  dest: tmpDir,
  limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = /\.(jpe?g|png|gif|webp|mp4|webm|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), asyncHandler(uploadController.upload));
router.get('/:id', asyncHandler(uploadController.getById));
router.delete('/:id', asyncHandler(uploadController.remove));

export default router;
