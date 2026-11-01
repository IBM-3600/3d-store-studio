import { Worker, Job } from 'bullmq';
import { PrismaClient } from '../generated/prisma';
import { AssetService } from '../services/asset.service';
import path from 'path';

const prisma = new PrismaClient();
const assetService = new AssetService();

const imageWorker = new Worker('image-processing', async (job: Job) => {
  const { assetId, filePath, filename } = job.data;

  await job.updateProgress(10);

  try {
    // Generate thumbnail
    const thumbnailFilename = `thumb_${filename}`;
    const thumbnailPath = path.join(path.dirname(filePath), thumbnailFilename);
    
    await job.updateProgress(30);
    await assetService.generateThumbnail(filePath, thumbnailPath, 200);
    
    await job.updateProgress(60);

    // Optimize original image
    const optimizedFilename = `opt_${filename}`;
    const optimizedPath = path.join(path.dirname(filePath), optimizedFilename);
    
    await assetService.optimizeImage(filePath, optimizedPath);
    
    await job.updateProgress(90);

    // Update asset record
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        thumbnailUrl: `/uploads/${thumbnailFilename}`,
        url: `/uploads/${optimizedFilename}`
      }
    });

    await job.updateProgress(100);

    return { success: true, assetId };
  } catch (error) {
    console.error('[ImageWorker] Processing failed:', error);
    throw error;
  }
}, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 5
});

imageWorker.on('completed', (job) => {
  console.log(`[ImageWorker] Job ${job.id} completed`);
});

imageWorker.on('failed', (job, err) => {
  console.error(`[ImageWorker] Job ${job?.id} failed:`, err);
});

console.log('[ImageWorker] Worker started');