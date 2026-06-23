import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3002,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3002',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: requireEnv('DATABASE_URL'),
  jwt: {
    accessSecret: requireEnv('JWT_ACCESS_SECRET'),
    refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  superAdmin: {
    phone: process.env.SUPER_ADMIN_PHONE || '+212600000000',
    password: process.env.SUPER_ADMIN_PASSWORD || 'admin123456',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 10,
  },
  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN || '',
    channelId: process.env.YOUTUBE_CHANNEL_ID || '',
    channelHandle: process.env.YOUTUBE_CHANNEL_HANDLE || 'mageDev-m2r',
    oauthRedirectUri: process.env.YOUTUBE_OAUTH_REDIRECT_URI || 'http://localhost:3333/oauth/callback',
    maxVideoMb: Number(process.env.YOUTUBE_MAX_VIDEO_MB) || 200,
    privacyStatus: process.env.YOUTUBE_PRIVACY_STATUS || 'unlisted',
    categoryId: process.env.YOUTUBE_CATEGORY_ID || '22',
  },
};
