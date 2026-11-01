import {PrismaClient} from "../generated/prisma/client"
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger';
// @ts-ignore: no type declarations for 'pg' in this project
import { Pool } from "pg";
import { URL } from "url";
import { env } from './env';

const url = new URL(env.DATABASE_URL! || "postgresql://studio_user:studio_password@localhost:5432/store_studio");

console.log({
  username: url.username,
  password: url.password,
  host: url.hostname,
  port: url.port,
  database: url.pathname,
  passwordType: typeof url.password,
});

const pool = new Pool({
    connectionString: env.DATABASE_URL || "postgresql://studio_user:studio_password@localhost:5432/store_studio",
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
   
    await prisma.$connect().then(() => {
      logger.info('✅ PostgreSQL connected');
    });
    //logger.info('✅ PostgreSQL connected');
    
    // Verify pgvector extension
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT extname FROM pg_extension WHERE extname = 'vector'`
    );
    
    if (result.length === 0) {
      logger.warn('⚠️  pgvector extension not found. Semantic memory will not work.');
      logger.warn('   Run: CREATE EXTENSION IF NOT EXISTS vector;');
    } else {
      logger.info('✅ pgvector extension enabled');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('🔌 Database disconnected');
}