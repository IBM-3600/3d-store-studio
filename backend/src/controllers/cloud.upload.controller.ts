// backend/src/controllers/upload.controller.ts
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { StorageService } from '../services/cloud.storage.service';
import { prisma } from '../config/database';
import { Queue } from 'bullmq';

const router: Router = Router();
const storageService = new StorageService();


const processingQueue = new Queue('asset-processing', {
  connection: { host: 'localhost', port: 6379 }
});

// Request upload URL
router.post('/request-upload', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    // Validate file type
    const allowedTypes = [
      'model/gltf-binary', // GLB
      'model/gltf+json',   // GLTF
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'video/mp4'
    ];

    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: `File type ${fileType} not allowed` });
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileSize > maxSize) {
      return res.status(400).json({ error: 'File size exceeds 500MB limit' });
    }

    const { uploadUrl, fileKey, publicUrl } = await storageService.generateUploadUrl(fileType, fileName);

    // Create pending asset record
    const asset = await prisma.asset.create({
      data: {
        name: fileName,
        type: fileType.startsWith('model/') ? 'MODEL' : 
              fileType.startsWith('image/') ? 'TEXTURE' :
              fileType.startsWith('audio/') ? 'AUDIO' : 'VIDEO',
        url: publicUrl,
        size: fileSize,
        status: 'UPLOADING'
      }
    });

    return res.json({
      uploadUrl,
      fileKey,
      assetId: asset.id,
      publicUrl
    });
  } catch (error) {
    console.error('[Upload] Request upload error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Confirm upload completion
router.post('/confirm-upload', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const { assetId, fileKey } = req.body;

    // Update asset status
    const asset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: 'UPLOADED',
        uploadedAt: new Date()
      }
    });

    // Queue for processing (thumbnail generation, optimization, etc.)
    await processingQueue.add('process-asset', {
      assetId: asset.id,
      fileKey,
      type: asset.type
    });

    res.json({ success: true, asset });
  } catch (error) {
    console.error('[Upload] Confirm upload error:', error);
    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

export default router;