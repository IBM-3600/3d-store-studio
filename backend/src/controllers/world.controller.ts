import { Router, Request, Response } from 'express';
import { PrismaClient, PublishStatus } from '../generated/prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { prisma } from '../config/database';
const router: Router = Router();


// List all worlds
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const where = status ? { status: status as PublishStatus } : {};
    
    const [worlds, total] = await Promise.all([
      prisma.world.findMany({
        where,
        include: {
          buildings: {
            include: {
              floors: {
                include: {
                  stores: false
                }
              }
            }
          },
          publishHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.world.count({ where })
    ]);

    return res.status(200).json({
      worlds,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[World] List error:', error);
    return res.status(500).json({ error: 'Failed to list worlds' });
  }
});

// Get world by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const world = await prisma.world.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                stores: {
                  include: {
                    instances: true,
                    shelves: true
                  }
                }
              }
            }
          }
        },
        publishHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    return res.status(200).json(world);
  } catch (error) {
    console.error('[World] Get error:', error);
    return res.status(500).json({ error: 'Failed to get world' });
  }
});

// Get scene data (hierarchy + instances)
router.get('/:id/scene', authenticate, async (req: Request, res: Response) => {
  try {
    if(req.params.id == "default-world"){
      return res.status(404).json({ error: 'default-world World not set yet' });
    }
    const world = await prisma.world.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        buildings: {
          include: {
            floors: {
              include: {
                stores: {
                  include: {
                    instances: {
                      include: {
                        product: true,
                        shelf: true
                      }
                    },
                    shelves: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!world) {
      return res.status(404).json({ error: 'World not found' });
    }

    // Build hierarchy
    const hierarchy = world.buildings.flatMap(building => 
      building.floors.flatMap(floor =>
        floor.stores.map(store => ({
          id: store.id,
          name: store.name,
          type: 'STORE',
          parentId: floor.id,
          visible: true,
          children: [
            ...store.shelves.map(shelf => ({
              id: shelf.id,
              name: shelf.name,
              type: 'SHELF',
              parentId: store.id,
              visible: true,
              children: store.instances
                .filter(inst => inst.shelfId === shelf.id)
                .map(inst => ({
                  id: inst.id,
                  name: inst.product?.name || 'Product',
                  type: 'PRODUCT',
                  parentId: shelf.id,
                  visible: inst.visibility
                }))
            })),
            ...store.instances
              .filter(inst => !inst.shelfId)
              .map(inst => ({
                id: inst.id,
                name: inst.product?.name || 'Object',
                type: inst.product ? 'PRODUCT' : 'OBJECT',
                parentId: store.id,
                visible: inst.visibility
              }))
          ]
        }))
      )
    );

    // Collect all instances
    const instances = world.buildings.flatMap(building =>
      building.floors.flatMap(floor =>
        floor.stores.flatMap(store => store.instances)
      )
    );

    return res.status(200).json({
      hierarchy,
      instances,
      environment: world.theme ? JSON.parse(world.theme) : {}
    });
  } catch (error) {
    console.error('[World] Get scene error:', error);
    return res.status(500).json({ error: 'Failed to get scene' });
  }
});

// Create world
router.post('/', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const { name, description, theme } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const world = await prisma.world.create({
      data: {
        name,
        description,
        theme: theme ? JSON.stringify(theme) : null,
        status: 'DRAFT'
      }
    });

    return res.status(201).json({ world });
  } catch (error) {
    console.error('[World] Create error:', error);
    return res.status(500).json({ error: 'Failed to create world' });
  }
});

// Update world
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const { name, description, theme, status } = req.body;

    const world = await prisma.world.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        theme: theme ? JSON.stringify(theme) : undefined,
        status
      }
    });

    return res.status(201).json({ world });
  } catch (error) {
    console.error('[World] Update error:', error);
    return res.status(500).json({ error: 'Failed to update world' });
  }
});

// Delete world
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.world.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true });
  } catch (error) {
    console.error('[World] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete world' });
  }
});

// Create instance
router.post('/:worldId/instances', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const { storeId, productId, shelfId, transform, metadata } = req.body;

    const instance = await prisma.objectInstance.create({
      data: {
        storeId,
        productId,
        shelfId,
        positionX: transform.position.x,
        positionY: transform.position.y,
        positionZ: transform.position.z,
        rotationX: transform.rotation.x,
        rotationY: transform.rotation.y,
        rotationZ: transform.rotation.z,
        scaleX: transform.scale.x,
        scaleY: transform.scale.y,
        scaleZ: transform.scale.z,
        customMetadata: metadata ? JSON.stringify(metadata) : undefined
      },
      include: {
        product: true
      }
    });

    return res.status(201).json({ instance });
  } catch (error) {
    console.error('[World] Create instance error:', error);
    return res.status(500).json({ error: 'Failed to create instance' });
  }
});

export default router;