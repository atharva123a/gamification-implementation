import { config } from 'dotenv';

config();

export const {
  ENV = 'development',
  PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  LOG_DIR = './logs',
  JWT_SECRET,
  NODE_DEV,
  CLIENT_URL,
  MONGO_URI
} = process.env;
