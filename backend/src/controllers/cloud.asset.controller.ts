import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { upload } from '../middleware/upload.middleware';
import { AssetService } from '../services/asset.service';
import { Queue } from 'bullmq';
import { config } from '../config/env';
import fs from 'fs/promises';
import path from 'path';

const router: Router = Router();


const assetService = new AssetService();

// Upload asset with metadata
router.post(
  '/upload',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

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

      // Determine asset type from MIME type
      let assetType = 'MODEL';
      if (req.file.mimetype.startsWith('image/')) assetType = 'TEXTURE';
      else if (req.file.mimetype.startsWith('audio/')) assetType = 'AUDIO';
      else if (req.file.mimetype.startsWith('video/')) assetType = 'VIDEO';

      // Parse JSON fields
      const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];
      const parsedDimensions = dimensions ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) : null;

      // Create asset record
      const asset = await prisma.asset.create({
        data: {
          name: name || req.file.originalname,
          type: assetType,
          url: `/uploads/${req.file.filename}`,
          size: req.file.size,
          description: description || null,
          category: category || null,
          tags: parsedTags,
          vendor: vendor || null,
          brand: brand || null,
          dimensions: parsedDimensions,
          polygonCount: polygonCount ? parseInt(polygonCount) : null,
          materialCount: materialCount ? parseInt(materialCount) : null,
          format: path.extname(req.file.originalname).toLowerCase().replace('.', ''),
          shopifyId: shopifyId || null,
          price: price ? parseFloat(price) : null,
          sku: sku || null,
          status: 'UPLOADED',
          uploadedBy: (req as any).user.id
        }
      });

      // Generate thumbnail for images
      if (assetType === 'TEXTURE') {
        try {
          const thumbnailFilename = `thumb_${req.file.filename}`;
          const thumbnailPath = path.join(config.uploadDir, thumbnailFilename);
          await assetService.generateThumbnail(req.file.path, thumbnailPath, 200);
          
          await prisma.asset.update({
            where: { id: asset.id },
            data: { thumbnailUrl: `/uploads/${thumbnailFilename}` }
          });
        } catch (thumbError) {
          console.error('[Asset] Thumbnail generation failed:', thumbError);
        }
      }

      return res.status(201).json({ 
        success: true,
        asset 
      });
    } catch (error) {
      console.error('[Asset] Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload asset' });
    }
  }
);

// List assets with filtering
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

    res.json({
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
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

// Get upload statistics
router.get('/stats/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.json(asset);
  } catch (error) {
    console.error('[Asset] Get error:', error);
    return res.status(500).json({ error: 'Failed to get asset' });
  }
});

// Get single asset
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    return res.json(asset);
  } catch (error) {
    console.error('[Asset] Get error:', error);
    return res.status(500).json({ error: 'Failed to get asset' });
  }
});

// Update asset metadata
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
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

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : undefined;
    const parsedDimensions = dimensions ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) : undefined;

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

    res.json({ asset });
  } catch (error) {
    console.error('[Asset] Update error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Delete asset
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete file from disk
    const filePath = path.join(config.uploadDir, path.basename(asset.url));
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn('[Asset] File not found on disk:', filePath);
    }

    // Delete thumbnail if exists
    if (asset.thumbnailUrl) {
      const thumbPath = path.join(config.uploadDir, path.basename(asset.thumbnailUrl));
      try {
        await fs.unlink(thumbPath);
      } catch (e) {
        // Ignore
      }
    }

    await prisma.asset.delete({ where: { id: Number(req.params.id) } });

    return res.json({ success: true });
  } catch (error) {
    console.error('[Asset] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// Get upload statistics
router.get('/stats/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const [total, byType, totalSize] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({
        by: ['type'],
        _count: true
      }),
      prisma.asset.aggregate({
        _sum: { size: true }
      })
    ]);

    res.json({
      total,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      totalSize: totalSize._sum.size || 0
    });
  } catch (error) {
    console.error('[Asset] Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;