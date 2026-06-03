import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

if (!JWT_SECRET && isProduction) {
  throw new Error('CRITICAL ERROR: JWT_SECRET environment variable is missing in production!');
}

export const config = {
  jwtSecret: JWT_SECRET || 'dev_secret_key_123_change_in_production',
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};

export default config;
