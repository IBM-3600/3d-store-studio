import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { upload as multerUpload } from '../middleware/upload.middleware'; // Import configured multer
import { StorageService } from '../services/storage.service';
import { prisma } from '../config/database';
import { Queue } from 'bullmq';
import path from 'path';

const router: Router = Router();
const storageService = new StorageService();

const processingQueue = new Queue('asset-processing', {
  connection: { host: 'localhost', port: 6379 }
});

/**
 * Single-step upload endpoint
 * Replaces the old two-step (request-url + confirm) process
 */
router.post(
  '/upload',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  multerUpload.single('file'), // ← Multer intercepts the file first
  async (req: Request, res: Response) => {
    try {
      // 1. Check if file was successfully parsed by multer
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // 2. Extract metadata from form data
      const {
        name,
        description,
        category,
        tags,
        vendor,
        brand,
        dimensions,
        polygonCount,
        materialCount,
        shopifyId,
        price,
        sku
      } = req.body;

      const file = req.file;

      // 3. Determine asset type and subfolder based on MIME type
      let assetType = 'MODEL';
      let subfolder = 'models';

      if (file.mimetype.startsWith('image/')) {
        assetType = 'TEXTURE';
        subfolder = 'textures';
      } else if (file.mimetype.startsWith('audio/')) {
        assetType = 'AUDIO';
        subfolder = 'audio';
      } else if (file.mimetype.startsWith('video/')) {
        assetType = 'VIDEO';
        subfolder = 'videos';
      } else if (file.originalname.toLowerCase().endsWith('.hdr')) {
        assetType = 'HDRI';
        subfolder = 'hdri';
      }

      // 4. Save file to local disk via StorageService
      // (Uses file.buffer because multer is configured with memoryStorage)
      const storageResult = await storageService.saveFile(
        file.buffer,
        file.originalname,
        subfolder
      );

      // 5. Parse JSON/array fields from form data
      const parsedTags = tags 
        ? (typeof tags === 'string' ? JSON.parse(tags) : tags) 
        : [];
      const parsedDimensions = dimensions 
        ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) 
        : null;

      // 6. Create asset record in database
      const asset = await prisma.asset.create({
        data: {
          name: name || file.originalname,
          type: assetType,
          url: storageResult.publicUrl,      // e.g., "/uploads/models/sofa_123.glb"
          size: storageResult.size,          // Actual file size in bytes
          description: description || null,
          category: category || null,
          tags: parsedTags,
          vendor: vendor || null,
          brand: brand || null,
          dimensions: parsedDimensions,
          polygonCount: polygonCount ? parseInt(polygonCount) : null,
          materialCount: materialCount ? parseInt(materialCount) : null,
          format: path.extname(file.originalname).toLowerCase().replace('.', ''),
          shopifyId: shopifyId || null,
          price: price ? parseFloat(price) : null,
          sku: sku || null,
          status: 'UPLOADED',
          uploadedBy: (req as any).user?.id // Adjust based on your auth middleware typing
        }
      });

      // 7. Queue for background processing (thumbnails, optimization, etc.)
      await processingQueue.add('process-asset', {
        assetId: asset.id,
        fileKey: storageResult.fileKey,
        type: asset.type
      });

      // 8. Return success response
      return res.status(201).json({
        success: true,
        asset
      });

    } catch (error) {
      console.error('[Upload] Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload asset' });
    }
  }
);

export default router;