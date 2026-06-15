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
};
