import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {prisma} from '../config/database';

const router: Router = Router();


// List products
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, search, vendor, tag } = req.query;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (vendor) {
      where.vendor = vendor as string;
    }
    
    if (tag) {
      where.tags = { has: tag as string };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { lastSyncedAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.status(200).json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[Product] List error:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// Get product by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('[Product] Get error:', error);
    return res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get product by Shopify ID
router.get('/shopify/:shopifyId', authenticate, async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { shopifyid: Number(req.params.shopifyId) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('[Product] Get by Shopify ID error:', error);
    return res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get product variants
router.get('/:id/variants', authenticate, async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const variants = JSON.parse(product.variants as string || '[]');
    return res.status(200).json({ variants });
  } catch (error) {
    console.error('[Product] Get variants error:', error);
    return res.status(500).json({ error: 'Failed to get variants' });
  }
});

export default router;