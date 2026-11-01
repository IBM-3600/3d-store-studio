import { Server } from 'socket.io';
import { QueueEvents } from 'bullmq';

export function setupSyncStatusSocket(io: Server) {
  const syncQueueEvents = new QueueEvents('shopify-sync', {
    connection: { host: 'localhost', port: 6379 }
  });

  syncQueueEvents.on('progress', (jobId, progress) => {
    // Broadcast progress to all connected clients
    io.emit('server:sync_progress', {
      jobId,
      percentage: progress,
      status: 'IN_PROGRESS'
    });
  });

  syncQueueEvents.on('completed', (jobId) => {
    io.emit('server:sync_progress', {
      jobId,
      percentage: 100,
      status: 'SUCCESS'
    });
  });

  syncQueueEvents.on('failed', (jobId, err) => {
    io.emit('server:sync_progress', {
      jobId,
      percentage: 0,
      status: 'FAILED',
      error: err
    });
  });

  console.log('[SyncStatusSocket] Sync status monitoring started');
}