import api, { unwrap } from '../api/client';

export const MAX_VIDEO_BYTES =
  (Number(process.env.REACT_APP_YOUTUBE_MAX_VIDEO_MB) || 200) * 1024 * 1024;

const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);

export function validateVideoFile(file) {
  if (!file) return 'No video file selected.';
  if (!ALLOWED_VIDEO_TYPES.has(file.type) && !/\.(mp4|webm|mov|avi)$/i.test(file.name)) {
    return 'Unsupported video format. Use MP4, WebM, or MOV.';
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const maxMb = Math.round(MAX_VIDEO_BYTES / (1024 * 1024));
    return `Video is too large. Maximum size is ${maxMb} MB.`;
  }
  return null;
}

/**
 * Upload a local video file to the marketplace YouTube channel (@mageDev-m2r).
 * Returns youtubeVideoId, videoUrl, and thumbnailUrl.
 */
export async function uploadVideoToYouTube({ file, title, description }) {
  if (!file) throw new Error('No video file provided');
  const validationError = validateVideoFile(file);
  if (validationError) throw new Error(validationError);

  const form = new FormData();
  form.append('video', file);
  form.append('title', String(title ?? '').trim());
  if (description) form.append('description', String(description).trim());

  const res = await api.post('/youtube/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
  });
  const data = unwrap(res);
  if (!data?.youtubeVideoId) throw new Error('YouTube upload failed');
  return {
    youtubeVideoId: data.youtubeVideoId,
    videoUrl: data.videoUrl || `https://www.youtube.com/watch?v=${data.youtubeVideoId}`,
    thumbnailUrl: data.thumbnailUrl || `https://i.ytimg.com/vi/${data.youtubeVideoId}/hqdefault.jpg`,
  };
}
