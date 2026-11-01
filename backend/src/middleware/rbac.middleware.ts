import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return next();
  };
}

export function requireOwnership(getOwnerId: (req: AuthRequest) => Promise<string | null>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Admin can access everything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const ownerId = await getOwnerId(req);
    
    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to access this resource' });
    }

    next();
  };
}