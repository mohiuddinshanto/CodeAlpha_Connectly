import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  mongoDbName: process.env.MONGODB_DB_NAME || 'connectly',
  jwtSecret:
    process.env.JWT_SECRET ||
    'connectly-dev-jwt-secret-change-in-production-2026',
  imgbbApiKey: process.env.IMGBB_API_KEY || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
