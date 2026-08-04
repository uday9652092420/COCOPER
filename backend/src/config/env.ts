import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

export const DB_CONFIG = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'CoconutCocktailDB',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'NewPassword@123',
  DATABASE_URL: process.env.DATABASE_URL || undefined,
};
