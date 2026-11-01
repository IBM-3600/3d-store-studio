// backend/src/middleware/performance.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    
    // Log slow requests
    if (durationMs > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${durationMs.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
    
    // Track metrics (could send to Prometheus/DataDog)
    if (process.env.METRICS_ENABLED) {
      // metrics.increment('http.requests');
      // metrics.histogram('http.request.duration', durationMs);
    }
  });
  
  next();
}