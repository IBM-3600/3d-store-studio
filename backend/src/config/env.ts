import dotenv from 'dotenv';

dotenv.config();
export const env = process.env
export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://studio_user:studio_password@localhost:5432/store_studio',
  
  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Shopify
  shopifyApiKey: process.env.SHOPIFY_API_KEY || '',
  shopifyApiSecret: process.env.SHOPIFY_API_SECRET || '',
  shopifyAccessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  shopifyShop: process.env.SHOPIFY_SHOP || '',
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5500', 'http://localhost:3000'],
  
  // File uploads
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  
  // CDN
  cdnBaseUrl: process.env.CDN_BASE_URL || 'https://cdn.example.com',
  
  // Sentry
  sentryDsn: process.env.SENTRY_DSN || '',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  //
  aws:{
    region: process.env.AWS_REGION || "",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.BUCKET || ""
  }
};