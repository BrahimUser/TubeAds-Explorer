import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { uploadRepository } from '../repositories/uploadRepository.js';
import { AuthorizationError, NotFoundError } from '../utils/AppError.js';
import { mapUpload } from '../utils/mappers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');
const uploadRoot = path.resolve(backendRoot, env.upload.dir);

function ensureUploadDir() {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
}

export const storageService = {
  getUploadRoot() {
    ensureUploadDir();
    return uploadRoot;
  },

  async saveFile(userId, file) {
    ensureUploadDir();
    const ext = path.extname(file.originalname) || '';
    const filename = `${uuidv4()}${ext}`;
    const storagePath = path.join(uploadRoot, filename);
    const publicUrl = `${env.apiBaseUrl}/uploads/${filename}`;

    fs.renameSync(file.path, storagePath);

    const upload = await uploadRepository.create({
      userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath,
      publicUrl,
    });
    return mapUpload(upload);
  },

  async getById(id) {
    const upload = await uploadRepository.findById(id);
    if (!upload) throw new NotFoundError('Upload not found');
    return mapUpload(upload);
  },

  async delete(userId, id) {
    const upload = await uploadRepository.findById(id);
    if (!upload) throw new NotFoundError('Upload not found');
    if (upload.userId !== userId) throw new AuthorizationError('Cannot delete this upload');

    if (fs.existsSync(upload.storagePath)) {
      fs.unlinkSync(upload.storagePath);
    }
    await uploadRepository.delete(id);
  },

  resolvePublicPath(filename) {
    const safe = path.basename(filename);
    const full = path.join(uploadRoot, safe);
    if (!full.startsWith(uploadRoot)) return null;
    return fs.existsSync(full) ? full : null;
  },
};
