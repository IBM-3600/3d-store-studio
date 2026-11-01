// backend/src/controllers/storage-settings.controller.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { customStorageService } from '../services/custom-storage.service';

const router: Router = Router();


// Get current settings (masks API key)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const settings = await prisma.storageSettings.findFirst();

    if (!settings) {
      return res.json({
        provider: 'local',
        isActive: false,
        baseUrl: null,
        apiKey: null,
        authType: 'bearer',
        authHeader: 'Authorization',
        uploadEndpoint: '/upload',
        deleteEndpoint: '/objects',
        listEndpoint: null,
        publicUrlBase: null,
        urlPattern: '{baseUrl}/{key}',
        forceHttps: true,
        customHeaders: null
      });
    }

    // Mask API key
    const maskedApiKey = settings.apiKey ? '••••••••••••••••' : null;

    return res.status(200).json({
      ...settings,
      apiKey: maskedApiKey,
      customHeaders: settings.customHeaders ? JSON.parse(settings.customHeaders as string) : null
    });
  } catch (error) {
    console.error('[StorageSettings] Get error:', error);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Save settings
router.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const {
      provider,
      baseUrl,
      apiKey,
      authType,
      authHeader,
      uploadEndpoint,
      deleteEndpoint,
      listEndpoint,
      publicUrlBase,
      urlPattern,
      forceHttps,
      isActive,
      customHeaders
    } = req.body;

    // Get existing to preserve API key if not changed
    const existing = await prisma.storageSettings.findFirst();
    const finalApiKey = apiKey === '••••••••••••••••' 
      ? existing?.apiKey 
      : apiKey;

    const settings = await prisma.storageSettings.upsert({
      where: { id: existing?.id || 'default' },
      update: {
        provider: provider || 'local',
        baseUrl: baseUrl || null,
        apiKey: finalApiKey || null,
        authType: authType || 'bearer',
        authHeader: authHeader || 'Authorization',
        uploadEndpoint: uploadEndpoint || '/upload',
        deleteEndpoint: deleteEndpoint || '/objects',
        listEndpoint: listEndpoint || null,
        publicUrlBase: publicUrlBase || null,
        urlPattern: urlPattern || '{baseUrl}/{key}',
        forceHttps: forceHttps ?? true,
        isActive: isActive ?? false,
        customHeaders: customHeaders ? JSON.stringify(customHeaders) : null
      },
      create: {
        id: 'default',
        provider: provider || 'local',
        baseUrl: baseUrl || null,
        apiKey: finalApiKey || null,
        authType: authType || 'bearer',
        authHeader: authHeader || 'Authorization',
        uploadEndpoint: uploadEndpoint || '/upload',
        deleteEndpoint: deleteEndpoint || '/objects',
        listEndpoint: listEndpoint || null,
        publicUrlBase: publicUrlBase || null,
        urlPattern: urlPattern || '{baseUrl}/{key}',
        forceHttps: forceHttps ?? true,
        isActive: isActive ?? false,
        customHeaders: customHeaders ? JSON.stringify(customHeaders) : null
      }
    });

    // Re-initialize service if activated
    if (settings.isActive && settings.provider === 'custom') {
      await customStorageService.initialize();
    }

   return res.status(200).json({ 
      success: true, 
      settings: { ...settings, apiKey: '••••••••••••••••' } 
    });
  } catch (error) {
    console.error('[StorageSettings] Save error:', error);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Test connection
router.post('/test', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const {
      baseUrl,
      apiKey,
      authType,
      authHeader,
      uploadEndpoint,
      deleteEndpoint,
      listEndpoint,
      publicUrlBase,
      urlPattern,
      customHeaders
    } = req.body;

    // Get existing API key if masked
    const existing = await prisma.storageSettings.findFirst();
    const finalApiKey = apiKey === '••••••••••••••••' 
      ? existing?.apiKey 
      : apiKey;

    if (!baseUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Base URL is required' 
      });
    }

    // Create temporary test client
    const axios = require('axios');
    const headers: Record<string, string> = {};
    
    if (customHeaders) {
      Object.assign(headers, customHeaders);
    }

    if (finalApiKey) {
      const headerName = authHeader || 'Authorization';
      switch (authType) {
        case 'bearer':
          headers[headerName] = `Bearer ${finalApiKey}`;
          break;
        case 'apikey':
          headers[headerName] = finalApiKey;
          break;
        case 'basic':
          headers[headerName] = `Basic ${Buffer.from(finalApiKey).toString('base64')}`;
          break;
      }
    }

    const testClient = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      timeout: 10000,
      headers
    });

    // Try to reach the server
    const testEndpoint = listEndpoint || '/health' || '/';
    
    try {
      const response = await testClient.get(testEndpoint);
     return res.json({ 
        success: true, 
        message: `Connected! Status: ${response.status}` 
      });
    } catch (error: any) {
      // Server reachable but endpoint might not exist
      if (error.response && error.response.status < 500) {
       return res.json({ 
          success: true, 
          message: `Server reachable (Status: ${error.response.status}). Endpoint may not exist.` 
        });
      } else {
       return res.json({ 
          success: false, 
          message: error.message || 'Connection failed' 
        });
      }
    }

  } catch (error: any) {
    console.error('[StorageSettings] Test error:', error);
   return res.json({ 
      success: false, 
      message: error.message || 'Test failed' 
    });
  }
});

export default router;