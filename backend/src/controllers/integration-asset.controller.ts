// backend/src/controllers/integration-asset.controller.ts
import { Router, Request, Response } from 'express';
import {  AssetType } from '../generated/prisma/client';
import { validateAppSecret } from '../middleware/validate-app-secret.middleware';
import { prisma } from '../config/database';

const router: Router = Router();

// Apply simple secret validation to all integration routes
router.use(validateAppSecret);

/**
 * GET /api/integration/assets
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, category, tag, search, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));

    const where: any = { status: 'READY' };

    if (type && Object.values(AssetType).includes(type as AssetType)) {
      where.type = type;
    }
    if (category) where.category = category;
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        select: {
          id: true,
          name: true, 
          type: true,
          bucketUrl: true, 
          thumbnailUrl: true,
          format: true, 
          category: true, 
          tags: true,
          dimensions: true, 
          shopifyId: true, 
          sku: true,
          price: true, 
          updatedAt: true
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.asset.count({ where })
    ]);

    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).json({
      data: assets,
      pagination: { page: pageNum, limit: limitNum, total }
    });
  } catch (error) {
   return res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

/**
 * GET /api/integration/assets/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

   return res.status(200).json({ data: asset });
  } catch (error) {
   return res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

export default router;