import fs from 'fs';
import { Readable } from 'stream';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/AppError.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD = 'https://www.googleapis.com/upload/youtube/v3/videos';

let cachedAccessToken = null;
let accessTokenExpiresAt = 0;
let resolvedChannelId = null;

function assertConfigured() {
  const { clientId, clientSecret, refreshToken } = env.youtube;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new ValidationError(
      'YouTube upload is not configured. Set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN.',
    );
  }
}

export function youtubeThumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function refreshAccessToken() {
  assertConfigured();
  const { clientId, clientSecret, refreshToken } = env.youtube;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ValidationError(`YouTube OAuth token refresh failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new ValidationError('YouTube OAuth token refresh returned no access_token.');
  }

  cachedAccessToken = data.access_token;
  accessTokenExpiresAt = Date.now() + Math.max(60, (data.expires_in || 3600) - 60) * 1000;
  return cachedAccessToken;
}

async function getAccessToken() {
  if (cachedAccessToken && Date.now() < accessTokenExpiresAt) {
    return cachedAccessToken;
  }
  return refreshAccessToken();
}

async function resolveChannelId(accessToken) {
  if (env.youtube.channelId) return env.youtube.channelId;
  if (resolvedChannelId) return resolvedChannelId;

  const handle = env.youtube.channelHandle.replace(/^@/, '');
  const url = `${YOUTUBE_API}/channels?part=id&forHandle=${encodeURIComponent(handle)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ValidationError(`Could not resolve YouTube channel @${handle} (${response.status}): ${text}`);
  }

  const data = await response.json();
  const id = data?.items?.[0]?.id;
  if (!id) {
    throw new ValidationError(`YouTube channel @${handle} was not found. Set YOUTUBE_CHANNEL_ID explicitly.`);
  }

  resolvedChannelId = id;
  return id;
}

async function verifyVideoChannel(accessToken, videoId, expectedChannelId) {
  const url = `${YOUTUBE_API}/videos?part=snippet&id=${encodeURIComponent(videoId)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ValidationError(`Could not verify uploaded video (${response.status}): ${text}`);
  }

  const data = await response.json();
  const channelId = data?.items?.[0]?.snippet?.channelId;
  if (!channelId) {
    throw new ValidationError('Uploaded video could not be verified on YouTube.');
  }
  if (channelId !== expectedChannelId) {
    throw new ValidationError(
      `Video uploaded to unexpected channel (${channelId}). Expected ${expectedChannelId}.`,
    );
  }
}

/**
 * Resumable upload: initiate session, then PUT the file bytes.
 */
async function uploadVideoResumable(accessToken, filePath, mimeType, metadata) {
  const stat = fs.statSync(filePath);
  const initUrl = `${YOUTUBE_UPLOAD}?uploadType=resumable&part=snippet,status`;

  const initResponse = await fetch(initUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(stat.size),
    },
    body: JSON.stringify(metadata),
  });

  if (!initResponse.ok) {
    const text = await initResponse.text().catch(() => '');
    throw new ValidationError(`YouTube upload init failed (${initResponse.status}): ${text}`);
  }

  const uploadUrl = initResponse.headers.get('location');
  if (!uploadUrl) {
    throw new ValidationError('YouTube upload init did not return a Location header.');
  }

  const stream = fs.createReadStream(filePath);
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(stat.size),
      'Content-Type': mimeType,
    },
    body: Readable.toWeb(stream),
    duplex: 'half',
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => '');
    throw new ValidationError(`YouTube upload failed (${uploadResponse.status}): ${text}`);
  }

  const result = await uploadResponse.json().catch(() => null);
  const videoId = result?.id;
  if (!videoId) {
    throw new ValidationError('YouTube upload succeeded but returned no video id.');
  }

  return videoId;
}

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
]);

export function assertAllowedVideoMime(mimeType) {
  if (!mimeType || !ALLOWED_VIDEO_MIMES.has(mimeType)) {
    throw new ValidationError('Unsupported video format. Use MP4, WebM, or MOV.');
  }
}

export const youtubeService = {
  async uploadFromFile({ filePath, mimeType, title, description }) {
    assertConfigured();
    assertAllowedVideoMime(mimeType);

    const nextTitle = String(title ?? '').trim();
    if (!nextTitle) {
      throw new ValidationError('Title is required for YouTube upload.');
    }

    const accessToken = await getAccessToken();
    const expectedChannelId = await resolveChannelId(accessToken);

    const metadata = {
      snippet: {
        title: nextTitle.slice(0, 100),
        description: String(description ?? '').slice(0, 5000),
        categoryId: env.youtube.categoryId,
      },
      status: {
        privacyStatus: env.youtube.privacyStatus,
      },
    };

    const videoId = await uploadVideoResumable(accessToken, filePath, mimeType, metadata);
    await verifyVideoChannel(accessToken, videoId, expectedChannelId);

    return {
      youtubeVideoId: videoId,
      videoUrl: youtubeWatchUrl(videoId),
      thumbnailUrl: youtubeThumbnailUrl(videoId),
    };
  },
};
