import { useMutation } from '@tanstack/react-query';
import { uploadFile } from '../services/uploads';

export function useUploadFile() {
  return useMutation({
    mutationFn: (file) => uploadFile(file),
    meta: { showGlobalLoader: true },
  });
}

/** Upload multiple files sequentially, returning public URLs. */
export function useUploadFiles() {
  return useMutation({
    mutationFn: async (files) => {
      const urls = [];
      for (const file of files) {
        urls.push(await uploadFile(file));
      }
      return urls;
    },
    meta: { showGlobalLoader: true },
  });
}
