// backend/src/workers/asset-processing.worker.ts
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '../generated/prisma';
import sharp from 'sharp';
import { StorageService } from '../services/storage.service';

const prisma = new PrismaClient();
const storageService = new StorageService();

const processingWorker = new Worker('asset-processing', async (job: Job) => {
  const { assetId, fileKey, type } = job.data;

  await job.updateProgress(10);

  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');

    // Process based on type
    if (type === 'TEXTURE' || type === 'IMAGE') {
      await processImage(asset, job);
    } else if (type === 'MODEL') {
      await processModel(asset, job);
    }

    // Update asset status
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'PROCESSED' }
    });

    await job.updateProgress(100);

    return { success: true, assetId };
  } catch (error) {
    console.error('[AssetProcessing] Error:', error);
    
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'FAILED' }
    });
    
    throw error;
  }
}, {
  connection: { host: 'localhost', port: 6379 },
  concurrency: 3
});

async function processImage(asset: any, job: Job) {
  // Download image from S3
  const response = await fetch(asset.url);
  const buffer = Buffer.from(await response.arrayBuffer());

  await job.updateProgress(30);

  // Generate thumbnail
  const thumbnailBuffer = await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  await job.updateProgress(60);

  // Upload thumbnail to S3
  const thumbnailKey = asset.url.replace('/assets/', '/thumbnails/');
  // Upload logic here...

  await job.updateProgress(90);

  // Update asset with thumbnail URL
  await prisma.asset.update({
    where: { id: asset.id },
    data: { thumbnailUrl: thumbnailKey }
  });
}

async function processModel(asset: any, job: Job) {
  // For 3D models, you might want to:
  // - Generate preview images
  // - Validate GLTF structure
  // - Extract metadata (polygon count, materials, etc.)
  
  await job.updateProgress(50);
  
  // Placeholder for model processing
  console.log(`Processing model: ${asset.name}`);
  
  await job.updateProgress(100);
}

processingWorker.on('completed', (job) => {
  console.log(`[AssetProcessing] Job ${job.id} completed`);
});

processingWorker.on('failed', (job, err) => {
  console.error(`[AssetProcessing] Job ${job?.id} failed:`, err);
});

console.log('[AssetProcessing] Worker started');