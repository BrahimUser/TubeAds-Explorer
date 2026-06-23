import fs from 'fs';
import { youtubeService } from '../services/youtubeService.js';
import { success } from '../utils/ApiResponse.js';
import { ValidationError } from '../utils/AppError.js';

function unlinkQuiet(path) {
  if (path) fs.unlink(path, () => undefined);
}

export const youtubeController = {
  async upload(req, res) {
    if (!req.file) throw new ValidationError('No video file uploaded');

    const title = String(req.body?.title ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    try {
      const result = await youtubeService.uploadFromFile({
        filePath,
        mimeType,
        title,
        description,
      });
      return success(res, result, 'Video uploaded to YouTube', 201);
    } finally {
      unlinkQuiet(filePath);
    }
  },
};
