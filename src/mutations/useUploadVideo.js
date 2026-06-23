import { useMutation } from '@tanstack/react-query';
import { uploadVideoToYouTube } from '../services/youtube';

export function useUploadVideo() {
  return useMutation({
    mutationFn: ({ file, title, description }) =>
      uploadVideoToYouTube({ file, title, description }),
    meta: { showGlobalLoader: true },
  });
}
