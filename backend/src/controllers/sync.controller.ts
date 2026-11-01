import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';
import { PrismaClient } from '../generated/prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { config } from '../config/env';
import { prisma } from '../config/database';
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

const router: Router = Router();


const syncQueue = new Queue('shopify-sync', {
  connection: { host: 'localhost', port: 6379 }
});

// Trigger manual sync
router.post('/trigger', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { worldId, type = 'products' } = req.body;
    const authReq = req as AuthenticatedRequest;

    const job = await syncQueue.add('sync', {
      shop: config.shopifyShop,
      accessToken: config.shopifyAccessToken,
      worldId,
      type,
      initiatedBy: authReq.user.id
    });

    res.json({
      success: true,
      jobId: job.id,
      message: 'Sync job queued'
    });
  } catch (error) {
    console.error('[Sync] Trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger sync' });
  }
});

// Get sync status
router.get('/status/:jobId', authenticate, async (req: Request, res: Response) => {
  try {
    const job = await syncQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const progress = job.progress;

    return res.json({
      jobId: job.id,
      state,
      progress,
      data: job.data,
      failedReason: job.failedReason
    });
  } catch (error) {
    console.error('[Sync] Status error:', error);
    return res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Get sync logs
router.get('/logs', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const logs = await prisma.syncLog.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({ logs });
  } catch (error) {
    console.error('[Sync] Logs error:', error);
    res.status(500).json({ error: 'Failed to get sync logs' });
  }
});

export default router;