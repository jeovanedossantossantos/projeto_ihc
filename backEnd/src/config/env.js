import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mentoria',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpires: '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  tzOffsetMinutes: Number(process.env.TZ_OFFSET_MINUTES ?? -180),
};
