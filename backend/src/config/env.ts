import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

export const DB_CONFIG = {
  DB_HOST: process.env.DB_HOST ,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DATABASE_URL: process.env.DATABASE_URL,
};
