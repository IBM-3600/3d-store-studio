// backend/src/controllers/integration-product.controller.ts
import { Router, Request, Response } from 'express';
import { validateAppSecret } from '../middleware/validate-app-secret.middleware';
import { prisma } from '../config/database';

const router: Router = Router();

// Apply simple secret validation to all integration routes
router.use(validateAppSecret);

/**
 * GET /api/integration/products
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tag, search, page = 1, limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));

    const where: any = { };
    
    if (tag) where.tags = { has: tag };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true, 
          description: true,
          vendor: true, 
          modelUrl: true,
          shopifyid: true, 
          images: true, 
          tags: true,
          sku: true,
          price: true, 
         lastSyncedAt: true
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { lastSyncedAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.set('Cache-Control', 'public, max-age=300');
    return res.status(200).json({
      data: products,
      pagination: { page: pageNum, limit: limitNum, total }
    });
  } catch (error) {
   return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/integration/products/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'product not found' });
    }

   return res.status(200).json({ data: product });
  } catch (error) {
   return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;