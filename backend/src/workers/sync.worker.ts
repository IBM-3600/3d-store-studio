// backend/src/workers/sync.worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '../generated/prisma';
import { ShopifyService } from '../services/shopify.service';
import { io } from '../index'; // Your main socket.io instance

const prisma = new PrismaClient();

const syncWorker = new Worker('shopify-sync', async (job: Job) => {
  const { shop, accessToken, worldId } = job.data;
  
  await job.updateProgress(10);
  
  // Log start
  await prisma.syncLog.create({
    data: { type: 'MANUAL', status: 'IN_PROGRESS', details: { worldId } }
  });

  const shopifyService = new ShopifyService(shop, accessToken);
  
  // Simulate chunked progress updates for UI
  job.updateProgress(30);
  await shopifyService.syncProducts();
  job.updateProgress(80);
  
  // Fetch collections/variants if needed...
  
  job.updateProgress(100);
  
  await prisma.syncLog.create({
    data: { type: 'MANUAL', status: 'SUCCESS', details: { worldId } }
  });

  // Notify frontend via Socket.io
  io.to(`world:${worldId}`).emit('server:sync_progress', { percentage: 100, status: 'SUCCESS' });
  
  return { success: true };
}, { connection: { host: 'localhost', port: 6379 } });

syncWorker.on('failed', async (job, err) => {
  console.error(`Sync job ${job?.id} failed:`, err);
  // Emit failure to socket
});