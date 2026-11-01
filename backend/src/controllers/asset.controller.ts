// backend/src/controllers/asset.controller.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { upload as multerUpload } from '../middleware/upload.middleware';
import { storageService } from '../services/storage.service';
import { AssetService } from '../services/asset.service';
import path from 'path';
import fs from 'fs/promises';
import { customStorageService } from '../services/custom-storage.service';
import axios from 'axios';

const router: Router = Router();

const assetService = new AssetService();

/**
 * Upload asset with metadata - stores to local uploads/ folder
 */

// Initialize on startup
customStorageService.initialize();

// In the upload endpoint, replace S3 logic with:

router.post(
  '/upload',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  multerUpload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const {
        name, description, category, tags, vendor, brand,
        dimensions, polygonCount, materialCount, shopifyId, price, sku,
        uploadToRemote  // Changed from uploadToS3
      } = req.body;

      const file = req.file;
      const shouldUploadToRemote = uploadToRemote === 'true' || uploadToRemote === true;

      // Determine asset type and subfolder
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

      let finalUrl = '';
      let storageLocation = 'LOCAL';
      let storageKey: string | null = null;
      let remoteUrl: string | null = null;
      let uploadedToRemote = false;

      // Route: Upload to custom CDN or Local
      if (shouldUploadToRemote && customStorageService.isConfigured()) {
        try {
          const remoteResult = await customStorageService.uploadFile(
            file.buffer,
            file.originalname,
            subfolder,
            file.mimetype
          );

          finalUrl = remoteResult.publicUrl;
          storageLocation = 'REMOTE';
          storageKey = remoteResult.storageKey;
          remoteUrl = remoteResult.publicUrl;
          uploadedToRemote = true;
        } catch (remoteError) {
          console.error('[Asset] Remote upload failed, falling back to local:', remoteError);
          // Fallback to local
          const storageResult = await storageService.saveFile(
            file.buffer,
            file.originalname,
            subfolder
          );
          finalUrl = storageResult.publicUrl;
        }
      } else {
        // Local storage
        const storageResult = await storageService.saveFile(
          file.buffer,
          file.originalname,
          subfolder
        );
        finalUrl = storageResult.publicUrl;
      }

      // Parse JSON fields
      const parsedTags = tags 
        ? (typeof tags === 'string' ? JSON.parse(tags) : tags) 
        : [];
      const parsedDimensions = dimensions 
        ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) 
        : null;

      // Create asset record
      const asset = await prisma.asset.create({
        data: {
          name: name || file.originalname,
          type: assetType,
          url: finalUrl,
          size: file.size,
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
          uploadedBy: ((req as any).user?.id).toString(),
          storageLocation,
          s3Key: storageKey,        // Reuse field for storage key
          s3Url: remoteUrl,         // Reuse field for remote URL
          uploadedToRemote
        }
      });

      return res.status(201).json({ success: true, asset });

    } catch (error) {
      console.error('[Asset] Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload asset' });
    }
  }
);

// Batch upload endpoint - update to use customStorageService
router.post(
  '/batch-upload-remote',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  async (req: Request, res: Response) => {
    try {
      const { assetIds } = req.body;

      if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
        return res.status(400).json({ error: 'No asset IDs provided' });
      }

      if (!customStorageService.isConfigured()) {
        return res.status(400).json({ 
          error: 'Remote storage is not configured. Please configure in Settings.' 
        });
      }

      const results = {
        success: [] as string[],
        failed: [] as { id: string; error: string }[]
      };

      for (const assetId of assetIds) {
        try {
          const asset = await prisma.asset.findUnique({ where: { id: assetId } });
          
          if (!asset) {
            results.failed.push({ id: assetId, error: 'Asset not found' });
            continue;
          }

          if (asset.storageLocation === 'REMOTE') {
            results.failed.push({ id: assetId, error: 'Already uploaded to remote' });
            continue;
          }

          // Read local file
          const localPath = storageService.getAbsolutePath(asset.url.replace('/uploads/', ''));
          const fileBuffer = await fs.readFile(localPath);

          // Determine subfolder
          const subfolderMap: Record<string, string> = {
            'MODEL': 'models',
            'TEXTURE': 'textures',
            'AUDIO': 'audio',
            'VIDEO': 'videos',
            'HDRI': 'hdri'
          };
          const subfolder = subfolderMap[asset.type] || 'other';

          // Upload to custom CDN
          const remoteResult = await customStorageService.uploadFile(
            fileBuffer,
            asset.name,
            subfolder
          );

          // Update asset record
          await prisma.asset.update({
            where: { id: assetId },
            data: {
              url: remoteResult.publicUrl,
              storageLocation: 'REMOTE',
              s3Key: remoteResult.storageKey,
              s3Url: remoteResult.publicUrl,
              uploadedToRemote: true
            }
          });

          results.success.push(assetId);
        } catch (assetError: any) {
          console.error(`[Asset] Batch upload failed for ${assetId}:`, assetError);
          results.failed.push({ id: assetId, error: assetError.message });
        }
      }

      return res.status(200).json({
        success: true,
        uploaded: results.success.length,
        failed: results.failed.length,
        results
      });

    } catch (error) {
      console.error('[Asset] Batch upload error:', error);
      return res.status(500).json({ error: 'Batch upload failed' });
    }
  }
);

/**
 * List assets with filtering
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      category,
      search,
      tag,
      vendor
    } = req.query;

    const where: any = {};
    
    if (type) where.type = type as string;
    if (category) where.category = category as string;
    if (vendor) where.vendor = vendor as string;
    if (tag) where.tags = { has: tag as string };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    return res.status(200).json({
      assets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[Asset] List error:', error);
    return res.status(500).json({ error: 'Failed to list assets' });
  }
});

/**
 * Get single asset
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.status(200).json(asset);
  } catch (error) {
    console.error('[Asset] Get error:', error);
    return res.status(500).json({ error: 'Failed to get asset' });
  }
});

/**
 * Update asset metadata
 */
router.patch(
  '/:id', 
  authenticate, 
  requireRole('ADMIN', 'EDITOR'), 
  async (req: Request, res: Response) => {
    try {
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
        sku,
        status
      } = req.body;

      const parsedTags = tags 
        ? (typeof tags === 'string' ? JSON.parse(tags) : tags) 
        : undefined;
      const parsedDimensions = dimensions 
        ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) 
        : undefined;

      const asset = await prisma.asset.update({
        where: { id: Number(req.params.id) },
        data: {
          name,
          description,
          category,
          tags: parsedTags,
          vendor,
          brand,
          dimensions: parsedDimensions,
          polygonCount: polygonCount ? parseInt(polygonCount) : undefined,
          materialCount: materialCount ? parseInt(materialCount) : undefined,
          shopifyId,
          price: price ? parseFloat(price) : undefined,
          sku,
          status
        }
      });

      return res.status(201).json({ asset });
    } catch (error) {
      console.error('[Asset] Update error:', error);
      return res.status(500).json({ error: 'Failed to update asset' });
    }
  }
);

/**
 * Delete asset (removes file from disk + DB record)
 */
router.delete(
  '/:id', 
  authenticate, 
  requireRole('ADMIN'), 
  async (req: Request, res: Response) => {
    try {
      const asset = await prisma.asset.findUnique({
        where: { id: Number(req.params.id) }
      });

      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      // Delete main file from disk
      if (asset.url) {
        const fileKey = asset.url.replace('/uploads/', '');
        await storageService.deleteFile(fileKey);
      }

      // Delete thumbnail if exists
      if (asset.thumbnailUrl) {
        const thumbKey = asset.thumbnailUrl.replace('/uploads/', '');
        await storageService.deleteFile(thumbKey);
      }

      // Delete from database
      await prisma.asset.delete({ where: { id: Number(req.params.id) } });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Asset] Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete asset' });
    }
  }
);

/**
 * Get upload statistics
 */
router.get('/stats/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const [total, byType, dbSize, diskSize] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.asset.aggregate({
        _sum: { size: true }
      }),
      storageService.getTotalStorage()
    ]);

    return res.status(200).json({
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      totalSize: dbSize._sum.size || 0,
      diskUsage: diskSize,
      uploadDir: storageService.getUploadDir()
    });
  } catch (error) {
    console.error('[Asset] Stats error:', error);
    return res.status(500).json({ error: 'Failed to get stats' });
  }
});


/**
 * Fetch metadata about an external URL (HEAD request + extension analysis)
 * POST /api/assets/fetch-url-info
 */
router.post(
  '/fetch-url-info',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Check extension
      const ext = path.extname(parsedUrl.pathname).toLowerCase().replace('.', '');
      const allowedExtensions = [
        'glb', 'gltf', 'fbx', 'obj',
        'jpg', 'jpeg', 'png', 'webp', 'gif',
        'hdr',
        'mp3', 'wav', 'ogg',
        'mp4', 'webm'
      ];

      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          error: `Unsupported file extension: .${ext || 'none'}`
        });
      }

      // HEAD request to validate accessibility and get metadata
      const headResponse = await axios.head(url, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });

      if (headResponse.status >= 400) {
        return res.status(400).json({
          error: `URL returned status ${headResponse.status}`
        });
      }

      // Extract metadata from headers
      const contentType = headResponse.headers['content-type'] || '';
      const contentLengthHeader = headResponse.headers['content-length'];
      const contentLength = parseInt(String(contentLengthHeader ?? '0'), 10);
      const fileName = path.basename(parsedUrl.pathname) || 'unknown';

      // Determine MIME type from extension if header is generic
      const mimeMap: Record<string, string> = {
        glb: 'model/gltf-binary',
        gltf: 'model/gltf+json',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        hdr: 'image/vnd.radiance',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        mp4: 'video/mp4'
      };

     return res.status(200).json({
        url,
        fileName,
        format: ext,
        mimeType: mimeMap[ext] || contentType || 'application/octet-stream',
        size: contentLength || null,
        accessible: true
      });

    } catch (error: any) {
      console.error('[Asset] URL fetch error:', error.message);
      return res.status(400).json({
        error: error.code === 'ECONNABORTED'
          ? 'URL request timed out'
          : `Failed to access URL: ${error.message}`
      });
    }
  }
);

/**
 * Register an externally-hosted asset URL (no file upload).
 * POST /api/assets/register-url
 */
router.post(
  '/register-url',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  async (req: Request, res: Response) => {
    try {
      const { url, metadata = {} } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Validate URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Extract info from URL
      const ext = path.extname(parsedUrl.pathname).toLowerCase().replace('.', '');
      const fileName = path.basename(parsedUrl.pathname) || `asset_${Date.now()}`;

      // Determine asset type
      let assetType = 'MODEL';
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) assetType = 'TEXTURE';
      else if (['mp3', 'wav', 'ogg'].includes(ext)) assetType = 'AUDIO';
      else if (['mp4', 'webm'].includes(ext)) assetType = 'VIDEO';
      else if (ext === 'hdr') assetType = 'HDRI';

      // Verify URL is accessible (GET with range to avoid downloading entire file)
      try {
        await axios.head(url, { timeout: 15000 });
      } catch (err: any) {
        return res.status(400).json({
          error: `URL is not accessible: ${err.message}`
        });
      }

      // Parse metadata
      const parsedTags = metadata.tags
        ? (typeof metadata.tags === 'string' ? JSON.parse(metadata.tags) : metadata.tags)
        : [];
      const parsedDimensions = metadata.dimensions
        ? (typeof metadata.dimensions === 'string' ? JSON.parse(metadata.dimensions) : metadata.dimensions)
        : null;

      // Create asset record with external URL
      const asset = await prisma.asset.create({
        data: {
          name: metadata.name || fileName.replace(/\.[^/.]+$/, ''),
          type: assetType,
          url: url, // Use the external URL directly
          size: 0, // Unknown unless we did HEAD request
          description: metadata.description || null,
          category: metadata.category || null,
          tags: parsedTags,
          vendor: metadata.vendor || null,
          brand: metadata.brand || null,
          dimensions: parsedDimensions,
          polygonCount: metadata.polygonCount ? parseInt(metadata.polygonCount) : null,
          materialCount: metadata.materialCount ? parseInt(metadata.materialCount) : null,
          format: ext,
          shopifyId: metadata.shopifyId || null,
          price: metadata.price ? parseFloat(metadata.price) : null,
          sku: metadata.sku || null,
          status: 'READY',
          storageLocation: 'REMOTE', // ← Mark as externally hosted
          s3Url: url,                // Reuse field to store external URL
          uploadedToRemote: true,    // Already "remote"
          uploadedBy: (req as any).user?.id.toString(),
          fileName,
          mimeType: null,
          bucketKey: metadata.bucketKey,
          bucketUrl: url
        }
      });

      return res.status(201).json({ success: true, asset });

    } catch (error: any) {
      console.error('[Asset] Register URL error:', error);
      return res.status(500).json({ error: 'Failed to register URL' });
    }
  }
);

export default router;