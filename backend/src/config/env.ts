import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

/**
 * Database connection config (driven by backend/.env).
 * Switch environments by commenting/uncommenting the matching
 * block inside backend/.env, then rebuild.
 */
export const DB_CONFIG = {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DATABASE_URL: process.env.DATABASE_URL,
};

/**
 * General application config (also driven by backend/.env).
 */
export const APP_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4004,
  API_BASE_URL: process.env.API_BASE_URL || '',
  FRONTEND_URL: process.env.FRONTEND_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

