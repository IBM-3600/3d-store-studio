// backend/src/utils/sentry.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 1.0,
      
      // Filter out sensitive data
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
        }
        return event;
      }
    });
  }
}

// Error handling middleware
export function sentryErrorHandler(err: any, req: any, res: any, next: any) {
  Sentry.captureException(err, {
    extra: {
      userId: req.user?.id,
      body: req.body,
      params: req.params
    }
  });
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}