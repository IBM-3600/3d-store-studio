import { Router, Request, Response } from 'express';
import {prisma} from '../config/database';
import { PublishService } from '../services/publish.service';
import { AnalyticsService } from '../services/analytics.service';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router: Router = Router();

const publishService = new PublishService();
const analyticsService = new AnalyticsService();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}
// Publish world
router.post('/:worldId', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { worldId } = req.params;
    const { scene } = req.body;

    if (!scene) {
      return res.status(400).json({ error: 'Scene data is required' });
    }

    const result = await publishService.publishWorld(worldId, req.user!.id, scene);

    return res.json(result);
  } catch (error) {
    console.error('[Publish] Error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to publish' });
  }
});

// Get published scene (public endpoint for customer app)
router.get('/:worldId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { worldId } = req.params;
    const version = req.query.version as string;

    let publishVersion;

    if (version) {
      publishVersion = await prisma.publishVersion.findFirst({
        where: { worldId: Number(worldId), version: parseInt(version) }
      });
    } else {
      // Get latest published version
      publishVersion = await prisma.publishVersion.findFirst({
        where: { worldId: Number(worldId) },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!publishVersion) {
      return res.status(404).json({ error: 'No published version found' });
    }

    // Fetch scene JSON from CDN
    const response = await fetch(publishVersion.snapshotUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch published scene');
    }

    const sceneData = await response.json();

    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    return res.json(sceneData);
  } catch (error) {
    console.error('[Publish] Get published scene error:', error);
    return res.status(500).json({ error: 'Failed to get published scene' });
  }
});

//Get Publish latest version
router.get('/:worldId/latest', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { worldId } = req.params;

    const latestVersion = await prisma.publishVersion.findFirst({
      where: { worldId: Number(worldId) },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!latestVersion) {
      return res.status(404).json({ error: 'No published version found' });
    }
  
    return res.json({
      version: latestVersion.version,
      snapshotUrl: latestVersion.snapshotUrl,
      publishedBy: latestVersion.publishedBy,
      createdAt: latestVersion.createdAt
    });
  } catch (error) {
    console.error('[Publish] Get latest version error:', error);
    return res.status(500).json({ error: 'Failed to get latest version' });
  }
});

// Get publish history
router.get('/:worldId/history', authenticate, async (req: Request, res: Response) => {
  try {
    const { worldId } = req.params;

    const history = await prisma.publishVersion.findMany({
      where: { worldId: Number(worldId) },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ history });
  } catch (error) {
    console.error('[Publish] Get history error:', error);
    res.status(500).json({ error: 'Failed to get publish history' });
  }
});

// Rollback to previous version
router.post('/:worldId/rollback/:version', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { worldId, version } = req.params;

    const targetVersion = await prisma.publishVersion.findFirst({
      where: { worldId: Number(worldId), version: parseInt(version) }
    });

    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Create new publish version with old snapshot
    const world = await prisma.world.findUnique({ where: { id: Number(worldId) } });
    const newVersion = (world?.version || 0) + 1;

    const newPublishVersion = await prisma.publishVersion.create({
      data: {
        worldId: Number(worldId),
        version: newVersion,
        snapshotUrl: targetVersion.snapshotUrl,
        publishedBy: req.user!.id
      }
    });

    await prisma.world.update({
      where: { id: Number(worldId) },
      data: { version: newVersion }
    });

    return res.json({
      success: true,
      version: newVersion,
      message: `Rolled back to version ${version}`
    });
  } catch (error) {
    console.error('[Publish] Rollback error:', error);
    return res.status(500).json({ error: 'Failed to rollback' });
  }
});

// Track analytics event (from customer app)
router.post('/analytics/track', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { worldId, eventType, productId, sessionId, metadata } = req.body;

    if (!worldId || !eventType) {
      return res.status(400).json({ error: 'worldId and eventType are required' });
    }

    await analyticsService.trackEvent(
      worldId,
      eventType,
      productId || null,
      sessionId || 'anonymous',
      metadata || {}
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('[Publish] Track analytics error:', error);
    return res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get analytics summary
router.get('/:worldId/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const { worldId } = req.params;
    const days = parseInt(req.query.days as string) || 7;

    const summary = await analyticsService.getWorldSummary(worldId, days);

    res.json(summary);
  } catch (error) {
    console.error('[Publish] Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router;