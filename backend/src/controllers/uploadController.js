import { storageService } from '../services/storageService.js';
import { success } from '../utils/ApiResponse.js';
import { ValidationError } from '../utils/AppError.js';

export const uploadController = {
  async upload(req, res) {
    if (!req.file) throw new ValidationError('No file uploaded');
    const upload = await storageService.saveFile(req.user.id, req.file);
    return success(res, { upload }, 'File uploaded', 201);
  },

  async getById(req, res) {
    const upload = await storageService.getById(req.params.id);
    return success(res, { upload });
  },

  async remove(req, res) {
    await storageService.delete(req.user.id, req.params.id);
    return success(res, {}, 'Upload deleted');
  },
};
