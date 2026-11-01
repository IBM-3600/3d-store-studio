// backend/src/middleware/validate-app-secret.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppStatus } from '../generated/prisma/client';
import {prisma} from '../config/database'


/**
 * Validates the app secret from the request header.
 * Expected header: X-App-Secret: sk_xxxxx
 * OR: Authorization: Bearer sk_xxxxx
 */

import { logger } from '../utils/logger';

export async function validateAppSecret(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = req.headers['x-app-secret'] as string ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!secret) {
    return res.status(401).json({
      error: 'Missing app secret. Provide X-App-Secret header or Bearer token.'
    });
  }

  try {
    const app = await prisma.application.findUnique({
      where: { appSecret: secret }
    });

    if (!app) {
      return res.status(401).json({ error: 'Invalid app secret' });
    }

    if (app.status !== 'ACTIVE') {
      return res.status(403).json({
        error: `Application is ${app.status}. Contact Studio admin.`
      });
    }

    // Attach app to request
    (req as any).app_data = app;

    // Safely get IP address with fallbacks
    const ipAddress = getClientIp(req);

    // Update last used timestamp (fire-and-forget)
    prisma.application
      .update({
        where: { id: app.id },
        data: { secretLastUsed: new Date() }
      })
      .catch(() => {});

    // Log the request (fire-and-forget)
    prisma.integrationLog
      .create({
        data: {
          appId: app.id,
          action: 'api.accessed',
          endpoint: req.originalUrl,
          method: req.method,
          ipAddress,
          userAgent: req.headers['user-agent'] as string
        }
      })
      .catch(() => {});

    next();
  } catch (error) {
    logger.error('[AppSecret] Validation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
  return;
}

/**
 * Safely extract client IP address with multiple fallbacks
 */
function getClientIp(req: Request): string {
  try {
    // Try req.ip first (Express built-in)
    if (req.ip) return req.ip;
    
    // Try req.app.get if app exists
    if (req.app && typeof req.app.get === 'function') {
      return req.ip || 'unknown';
    }
    
    // Fallback to socket remote address
    if (req.socket?.remoteAddress) {
      return req.socket.remoteAddress;
    }
    
    // Fallback to connection remote address
    if ((req as any).connection?.remoteAddress) {
      return (req as any).connection.remoteAddress;
    }
    
    // Check forwarded headers manually
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }
    
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}