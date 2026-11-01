// backend/src/controllers/application.controller.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppStatus, EnvironmentType } from '../generated/prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { applicationService } from '../services/application.service';
import { generateAppSecret, generateWebhookSecret } from '../utils/secret';
const router: Router = Router();


// Helper: Generate API key
function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk_${uuidv4().replace(/-/g, '')}${crypto.randomBytes(16).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 12);
  return { key, hash, prefix };
}

// Helper: Generate webhook secret
// function generateWebhookSecret(): string {
//   return `whsec_${crypto.randomBytes(32).toString('hex')}`;
// }

// Helper: Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


/**
 * POST /api/applications
 * Register a new 3D Store. Returns the appSecret (shown only once).
 */
router.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'EDITOR'),
  async (req: Request, res: Response) => {
    try {
      const { name, description, website, logoUrl, allowedOrigins } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Application name is required' });
      }

      // Generate slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check for duplicate slug
      const existing = await prisma.application.findUnique({ where: { slug } });
      if (existing) {
        return res.status(409).json({
          error: 'An application with this name already exists'
        });
      }

      // Generate secrets
      const appSecret = generateAppSecret();
      const webhookSecret = generateWebhookSecret();

      // Create application
      const app = await prisma.application.create({
        data: {
          name,
          slug,
          description: description || null,
          website: website || null,
          logoUrl: logoUrl || null,
          ownerId: (req as any).user.id,
          status: AppStatus.ACTIVE,
          appSecret,
          webhookSecret,
          allowedOrigins: allowedOrigins || []
        },
        include: {
          environments: false // Don't include yet
        }
      });

      // Create default environments
      const defaultEnvs = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'];
      await prisma.appEnvironment.createMany({
        data: defaultEnvs.map((type) => ({
          appId: app.id,
          name: type.charAt(0) + type.slice(1).toLowerCase(),
          type: type as any,
          isActive: true
        }))
      });

      // Return the app WITH the plaintext secret (only shown once!)
     return res.status(201).json({
        success: true,
        application: {
          id: app.id,
          name: app.name,
          slug: app.slug,
          status: app.status,
          webhookSecret: app.webhookSecret,
          createdAt: app.createdAt
        },
        // ⚠️ Show this ONCE. It won't be retrievable again.
        appSecret: appSecret,
        message: 'Store registered. Save the appSecret securely — it will not be shown again.'
      });
    } catch (error: any) {
      console.error('[Application] Registration error:', error);
      return res.status(500).json({ error: 'Failed to register application' });
    }
  }
);

/**
 * POST /api/applications/:id/regenerate-secret
 * Regenerate the secret if it's compromised.
 */
router.post(
  '/:id/regenerate-secret',
  authenticate,
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const newSecret = generateAppSecret();

      const app = await prisma.application.update({
        where: { id: Number(req.params.id) },
        data: {
          appSecret: newSecret,
          secretCreatedAt: new Date()
        }
      });

     return res.status(200).json({
        success: true,
        appSecret: newSecret,
        message: 'Secret regenerated. Update your 3D Store configuration immediately.'
      });
    } catch (error) {
     return res.status(500).json({ error: 'Failed to regenerate secret' });
    }
  }
);

router.post('/handshake', async (req: Request, res: Response) => {
  try {
    const {appName, sourceUrl, secret} = req.body;

    if (!appName || !sourceUrl || !secret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const handshakeResponse: any = await applicationService.initHandshake(sourceUrl, secret);

    const applicationData = {
      name: appName,
      slug: generateSlug(appName),
      ownerId: (req as any).user?.id || 'system',
      description: '',
      sourceName: handshakeResponse.sourceName || '',
      website: sourceUrl || null,
      appSecret: secret,
      logoUrl: '',
      allowedOrigins: [],
      version: handshakeResponse.Version || '',
      status: handshakeResponse.status || AppStatus.ACTIVE
    };

    if (handshakeResponse.status != AppStatus.ACTIVE) {
      applicationData.status = handshakeResponse.status || AppStatus.INACTIVE;
    }

    if(handshakeResponse) { 
      await prisma.application.create({ data: applicationData });
    }

    if (handshakeResponse.success) {
      return res.status(200).json({ success: true, message: 'Handshake successful' });
    }

    return res.status(400).json({ success: false, message: 'Handshake failed', details: handshakeResponse });

  } catch (error) {
    console.error('Error during handshake:', error);
    return res.status(500).json({ error: 'Failed to initialize handshake' });
  }
})

/**
 * List all applications
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const where = status ? { status: status as AppStatus } : {};

    const [apps, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          apiKeys: { select: { id: true, name: true, isActive: true } },
          environments: { select: { id: true, name: true, type: true, isActive: true } },
          _count: { select: { publishedVersions: true } }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.application.count({ where })
    ]);

    res.status(200).json({
      applications: apps,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[Application] List error:', error);
    res.status(500).json({ error: 'Failed to list applications' });
  }
});

/**
 * Get single application with full details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyPrefix: true,
            lastUsedAt: true,
            expiresAt: true,
            isActive: true,
            scopes: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        environments: {
          orderBy: { createdAt: 'asc' }
        },
        webhooks: {
          orderBy: { createdAt: 'desc' }
        },
        publishedVersions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        integrationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

   return res.status(200).json(app);
  } catch (error) {
    console.error('[Application] Get error:', error);
   return res.status(500).json({ error: 'Failed to get application' });
  }
});

/**
 * Register a new application (3D store)
 */
// router.post('/', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
//   try {
//     const {
//       name,
//       description,
//       website,
//       logoUrl,
//       allowedOrigins
//     } = req.body;

//     if (!name) {
//       return res.status(400).json({ error: 'Application name is required' });
//     }

//     const slug = generateSlug(name);

//     // Check if slug exists
//     const existing = await prisma.application.findUnique({ where: { slug } });
//     if (existing) {
//       return res.status(409).json({ error: 'Application with this name already exists' });
//     }

//     // Create application
//     const app = await prisma.application.create({
//       data: {
//         name,
//         slug,
//         description: description || null,
//         website: website || null,
//         logoUrl: logoUrl || null,
//         ownerid: Number((req as any).user.id),
//         allowedOrigins: allowedOrigins || [],
//         webhookSecret: generateWebhookSecret(),
//         status: AppStatus.ACTIVE
//       }
//     });

//     // Create default environments
//     const defaultEnvironments = [
//       { name: 'Development', type: EnvironmentType.DEVELOPMENT },
//       { name: 'Staging', type: EnvironmentType.STAGING },
//       { name: 'Production', type: EnvironmentType.PRODUCTION }
//     ];

//     await prisma.appEnvironment.createMany({
//       data: defaultEnvironments.map(env => ({
//         appId: app.id,
//         ...env,
//         isActive: true
//       }))
//     });

//     // Generate initial API key
//     const { key, hash, prefix } = generateApiKey();
    
//     await prisma.apiKey.create({
//       data: {
//         appId: app.id,
//         name: 'Default API Key',
//         keyHash: hash,
//         keyPrefix: prefix,
//         scopes: ['read:scenes', 'read:products', 'write:publish']
//       }
//     });

//     // Return with the plaintext key (only shown once!)
//     const fullApp = await prisma.application.findUnique({
//       where: { id: app.id },
//       include: {
//         apiKeys: true,
//         environments: true
//       }
//     });

//    return res.status(201).json({
//       success: true,
//       application: fullApp,
//       apiKey: key // Show once, never again
//     });

//   } catch (error) {
//     console.error('[Application] Create error:', error);
//    return res.status(500).json({ error: 'Failed to create application' });
//   }
// });

/**
 * Update application
 */
router.patch('/:id', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      website,
      logoUrl,
      allowedOrigins,
      status
    } = req.body;

    const app = await prisma.application.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        website,
        logoUrl,
        allowedOrigins,
        status
      }
    });

   return res.status(200).json({ success: true, application: app });
  } catch (error) {
    console.error('[Application] Update error:', error);
   return res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * Delete application
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    // Delete related records first
    await prisma.apiKey.deleteMany({ where: { appId: Number(req.params.id) } });
    await prisma.appEnvironment.deleteMany({ where: { appId: Number(req.params.id) } });
    await prisma.webhook.deleteMany({ where: { appId: Number(req.params.id) } });
    await prisma.publishedAppVersion.deleteMany({ where: { appId: Number(req.params.id) } });
    await prisma.integrationLog.deleteMany({ where: { appId: Number(req.params.id) } });

    await prisma.application.delete({ where: { id: Number(req.params.id) } });

   return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Application] Delete error:', error);
   return res.status(500).json({ error: 'Failed to delete application' });
  }
});

/**
 * Generate new API key for application
 */
router.post('/:id/api-keys', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const { name, scopes, expiresInDays } = req.body;

    const { key, hash, prefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        appId: Number(req.params.id),
        name: name || 'API Key',
        keyHash: hash,
        keyPrefix: prefix,
        scopes: scopes || ['read:scenes'],
        expiresAt: expiresInDays 
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null
      }
    });

    return res.status(201).json({
      success: true,
      apiKey: {
        ...apiKey,
        key // Show plaintext only once
      }
    });
  } catch (error) {
    console.error('[Application] Create API key error:', error);
   return res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * Revoke API key
 */
router.delete('/:id/api-keys/:keyId', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.apiKey.delete({
      where: { id: Number(req.params.keyId) }
    });

   return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Application] Revoke API key error:', error);
   return res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

/**
 * Add webhook to application
 */
router.post('/:id/webhooks', authenticate, requireRole('ADMIN', 'EDITOR'), async (req: Request, res: Response) => {
  try {
    const { url, events } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }

    const webhook = await prisma.webhook.create({
      data: {
        appId: Number(req.params.id),
        url,
        events: events || ['scene.published'],
        secret: generateWebhookSecret()
      }
    });

   return res.status(201).json({ success: true, webhook });
  } catch (error) {
    console.error('[Application] Create webhook error:', error);
    return res.status(500).json({ error: 'Failed to create webhook' });
  }
});

/**
 * Delete webhook
 */
router.delete('/:id/webhooks/:webhookId', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.webhook.delete({
      where: { id: Number(req.params.webhookId) }
    });

   return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Application] Delete webhook error:', error);
   return res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

/**
 * Get integration code snippets for the application
 */
router.get('/:id/integration-code', authenticate, async (req: Request, res: Response) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        apiKeys: { where: { isActive: true }, take: 1 },
        environments: true
      }
    });

    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const apiKeyPrefix = app.apiKeys[0]?.keyPrefix || 'YOUR_API_KEY';

    // Generate integration code snippets
    const snippets = {
      // JavaScript SDK initialization
      javascript: `
// ============================================
// 3D Store Studio - Integration SDK
// App: ${app.name} (${app.slug})
// ============================================

import { StudioClient } from '@3d-store-studio/sdk';

// Initialize the Studio client
const studio = new StudioClient({
  baseUrl: '${apiBaseUrl}',
  apiKey: '${apiKeyPrefix}...', // Use your full API key
  appId: '${app.id}',
  environment: 'production' // or 'staging', 'development'
});

// Load the published scene
async function loadStore() {
  try {
    const scene = await studio.getPublishedScene();
    console.log('Scene loaded:', scene);
    
    // Initialize your 3D engine with the scene data
    initializeYour3DEngine(scene);
  } catch (error) {
    console.error('Failed to load scene:', error);
  }
}

// Subscribe to real-time updates
studio.on('scene.updated', (data) => {
  console.log('Scene was updated, reloading...');
  loadStore();
});

studio.on('product.updated', (product) => {
  console.log('Product updated:', product);
  updateProductInScene(product);
});

// Initialize
loadStore();
`,

      // Vanilla JavaScript (no SDK)
      vanillaJs: `
// ============================================
// Vanilla JS Integration (No SDK required)
// App: ${app.name}
// ============================================

const STUDIO_CONFIG = {
  baseUrl: '${apiBaseUrl}',
  apiKey: '${apiKeyPrefix}...',
  appId: '${app.id}',
  environment: 'production'
};

// Fetch published scene
async function fetchPublishedScene() {
  const response = await fetch(
    \`\${STUDIO_CONFIG.baseUrl}/api/integration/\${STUDIO_CONFIG.appId}/scene?env=\${STUDIO_CONFIG.environment}\`,
    {
      headers: {
        'Authorization': \`Bearer \${STUDIO_CONFIG.apiKey}\`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(\`Failed to fetch scene: \${response.statusText}\`);
  }

  return response.json();
}

// WebSocket for real-time updates
function connectWebSocket() {
  const wsUrl = STUDIO_CONFIG.baseUrl.replace('http', 'ws') + '/socket.io';
  
  const socket = io(STUDIO_CONFIG.baseUrl, {
    transports: ['websocket'],
    auth: {
      appId: STUDIO_CONFIG.appId,
      apiKey: STUDIO_CONFIG.apiKey
    }
  });

  socket.on('connect', () => {
    console.log('[Studio] Connected to real-time updates');
    socket.emit('app:subscribe', { appId: STUDIO_CONFIG.appId });
  });

  socket.on('scene:published', (data) => {
    console.log('[Studio] New scene published, reloading...');
    fetchPublishedScene().then(initializeScene);
  });

  socket.on('product:updated', (product) => {
    console.log('[Studio] Product updated:', product);
    updateProductDisplay(product);
  });

  return socket;
}

// Initialize your 3D store
async function initStore() {
  try {
    const scene = await fetchPublishedScene();
    initializeScene(scene);
    connectWebSocket();
  } catch (error) {
    console.error('[Studio] Initialization failed:', error);
  }
}

function initializeScene(sceneData) {
  // Your Three.js / Babylon.js / custom engine code here
  console.log('Initializing scene with:', sceneData.instances.length, 'objects');
  
  // Example: Load models, set up lighting, etc.
  sceneData.instances.forEach(instance => {
    if (instance.type === 'PRODUCT') {
      loadProductModel(instance);
    }
  });
}

// Start
initStore();
`,

      // React integration example
      react: `
// ============================================
// React Integration Example
// App: ${app.name}
// ============================================

import { useEffect, useState } from 'react';
import { StudioClient } from '@3d-store-studio/sdk';

const studio = new StudioClient({
  baseUrl: '${apiBaseUrl}',
  apiKey: process.env.REACT_APP_STUDIO_API_KEY,
  appId: '${app.id}'
});

function VirtualStore() {
  const [scene, setScene] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScene() {
      try {
        const data = await studio.getPublishedScene();
        setScene(data);
      } catch (error) {
        console.error('Failed to load scene:', error);
      } finally {
        setLoading(false);
      }
    }

    loadScene();

    // Subscribe to updates
    const unsubscribe = studio.on('scene.published', () => {
      loadScene();
    });

    return unsubscribe;
  }, []);

  if (loading) return <div>Loading 3D Store...</div>;
  if (!scene) return <div>Failed to load store</div>;

  return (
    <div id="store-container">
      {/* Your 3D canvas component */}
      <ThreeCanvas sceneData={scene} />
    </div>
  );
}
`,

      // Webhook handler example (Node.js)
      webhookHandler: `
// ============================================
// Webhook Handler (Node.js/Express)
// Deploy this on your 3D store's backend
// ============================================

const express = require('express');
const crypto = require('crypto');
const app = express();

const WEBHOOK_SECRET = '${app.webhookSecret || 'YOUR_WEBHOOK_SECRET'}';

// Verify webhook signature
function verifySignature(payload, signature) {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

app.post('/webhooks/studio', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-studio-signature'];
  
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body);
  
  switch (event.type) {
    case 'scene.published':
      console.log('New scene published:', event.data.version);
      // Trigger cache invalidation, CDN purge, etc.
      invalidateSceneCache();
      break;
      
    case 'product.updated':
      console.log('Product updated:', event.data.productId);
      updateProductInDatabase(event.data);
      break;
      
    case 'product.deleted':
      console.log('Product removed:', event.data.productId);
      removeProductFromScene(event.data.productId);
      break;
  }

  res.json({ received: true });
});

app.listen(3001, () => {
  console.log('Webhook server listening on port 3001');
});
`,

      // Environment variables template
      envTemplate: `
# .env - Add these to your 3D store's environment
STUDIO_API_URL=${apiBaseUrl}
STUDIO_API_KEY=${apiKeyPrefix}...
STUDIO_APP_ID=${app.id}
STUDIO_ENVIRONMENT=production
STUDIO_WEBHOOK_SECRET=${app.webhookSecret || 'YOUR_WEBHOOK_SECRET'}
`
    };

   return res.status(200).json({
      appId: app.id,
      appName: app.name,
      apiBaseUrl,
      snippets
    });

  } catch (error) {
    console.error('[Application] Integration code error:', error);
    return res.status(500).json({ error: 'Failed to generate integration code' });
  }
});

export default router;