import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = Router();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}
// Add comment
router.post('/worlds/:worldId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { worldId } = req.params;
    const { objectId, message, position } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const comment = await prisma.comment.create({
      data: {
       worldId: Number(worldId),
        objectId,
        userId: Number(req.user!.id),
        message,
        position: position ? JSON.stringify(position) : null,
        status: 'OPEN'
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    // Notify via Socket.io
    const io = req.app.get('io');
    io.to(`world:${worldId}`).emit('comment:added', comment);

    return res.status(201).json(comment);
  } catch (error) {
    console.error('[Comment] Add error:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get comments for world
router.get('/worlds/:worldId', authenticate, async (req: Request, res: Response) => {
  try {
    const { worldId } = req.params;
    const status = req.query.status as string;

    const where: any = { worldId };
    if (status) {
      where.status = status;
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ comments });
  } catch (error) {
    console.error('[Comment] Get error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Resolve comment
router.patch('/:id/resolve', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.update({
      where: { id: Number(id) },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    // Notify via Socket.io
    const io = req.app.get('io');
    io.to(`world:${comment.worldId}`).emit('comment:resolved', { id });

    res.json(comment);
  } catch (error) {
    console.error('[Comment] Resolve error:', error);
    res.status(500).json({ error: 'Failed to resolve comment' });
  }
});

// Delete comment
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id: Number(id) } });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only allow deletion by author or admin
    if (comment.userId !== Number(req.user!.id) && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.comment.delete({ where: { id: Number(id) } });

    const io = req.app.get('io');
    io.to(`world:${comment.worldId}`).emit('comment:deleted', { id });

    return res.json({ success: true });
  } catch (error) {
    console.error('[Comment] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Add comment to object
router.post('/worlds/:worldId/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { worldId } = req.params;
    const { objectId, message, position } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const comment = await prisma.comment.create({
      data: {
        worldId: Number(worldId),
        objectId,
        userId: Number(req.user!.id),
        message,
        position: position || null, // 3D position in scene
        status: 'OPEN'
      },
      include: {
        user: { select: { id: true, email: true } }
      }
    });

    // Notify via Socket.io
    req.app.get('io').to(`world:${worldId}`).emit('comment:added', comment);

    return res.status(201).json(comment);
  } catch (error) {
    console.error('[Comment] Add error:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Resolve comment
router.patch('/comments/:id/resolve', authenticate, async (req, res) => {
  const { id } = req.params;

  const comment = await prisma.comment.update({
    where: { id: Number(id) },
    data: { status: 'RESOLVED', resolvedAt: new Date() }
  });

  req.app.get('io').to(`world:${comment.worldId}`).emit('comment:resolved', { id });

  res.json(comment);
});

export default router;