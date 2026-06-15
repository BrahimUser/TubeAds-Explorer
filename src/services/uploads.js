import api, { unwrap } from '../api/client';

export async function uploadFile(file) {
  if (!file) throw new Error('No file provided');
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const { upload } = unwrap(res);
  if (!upload?.publicUrl) throw new Error('Upload failed');
  return upload.publicUrl;
}
