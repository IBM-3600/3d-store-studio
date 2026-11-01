// TypeScript entry point
import express,{Application} from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import { prisma, connectDatabase } from './config/database';
import { config } from './config/env';
import { redisClient } from './config/redis';
import { requestLogger } from './utils/logger';
//import { initSentry, sentryErrorHandler } from './utils/sentry';
import { applySecurityMiddleware } from './middleware/security.middleware';
import { performanceMonitor } from './middleware/performance.middleware';

// Import routes
import authRoutes from './controllers/auth.controller';
import worldRoutes from './controllers/world.controller';
import productRoutes from './controllers/product.controller';
import assetRoutes from './controllers/asset.controller';
import syncRoutes from './controllers/sync.controller';
import publishedRoutes from './controllers/published.controller';
import commentRoutes from './controllers/comment.controller';
import UploadRoutes from './controllers/upload.controller';
import applicationRoutes from './controllers/application.controller';
import integrationRoutes from './controllers/integration.controller';
// Import socket handlers
import { setupCollaborationSocket } from './sockets/collaboration.socket';
import { setupSyncStatusSocket } from './sockets/sync-status.socket';

// Handle BigInt serialization globally
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.allowedOrigins,
    credentials: true
  }
});

const startServer = async () => {
  await connectDatabase();

  // Seed database if needed
  //await seedDatabase();

  // Initialize Sentry
  //initSentry();

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "wss:", "https:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:", "blob:"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({
     origin: (origin, callback) => {
        if (!origin || config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: ${origin}`));
        }
      },

      credentials: true,

      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
      ],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  applySecurityMiddleware(app);

  // Custom middleware
  app.use(requestLogger);
  app.use(performanceMonitor);

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(config.uploadDir), {
  maxAge: '7d', // Cache for 7 days
  etag: true,
  lastModified: true
}));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });


  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/worlds', worldRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/assets', assetRoutes);
  app.use('/api/sync', syncRoutes);
  app.use('/api/published', publishedRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/upload', UploadRoutes);
  app.use('/api/applications', applicationRoutes);
// Integration APIs (Accessed by 3D Store Servers)
  app.use('/api/integration', integrationRoutes);
  
  // Make io accessible to routes
  app.set('io', io);

  // Setup Socket.io
  setupCollaborationSocket(io);
  setupSyncStatusSocket(io);

  // Error handling
  //app.use(sentryErrorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
    });
  });

  // Start server
  const PORT = config.port || 3000;

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Server] Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Server] SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
    });
    await prisma.$disconnect();
    await redisClient.quit();
    process.exit(0);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, httpServer, io, prisma };