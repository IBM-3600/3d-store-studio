import Redis from 'ioredis';
import { config } from './env';

export const redisClient = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Error:', err);
});

redisClient.on('close', () => {
  console.log('[Redis] Connection closed');
});

export default redisClient;