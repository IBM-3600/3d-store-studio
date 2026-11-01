// backend/src/sockets/collaboration.socket.ts
import { Server, Socket } from 'socket.io';
import { prisma } from '../config/database';


const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setupCollaborationSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    const { worldId, userId } = socket.handshake.auth;

    socket.join(`world:${worldId}`);

    // Request lock on an object
    socket.on('client:lock_request', async ({ objectId }) => {
      const existingLock = await prisma.objectLock.findFirst({
        where: { objectId, expiresAt: { gt: new Date() } }
      });

      if (existingLock && existingLock.userId !== userId) {
        socket.emit('server:lock_denied', { objectId, lockedBy: existingLock.userId });
        return;
      }

      // Upsert lock
      const lock = await prisma.objectLock.upsert({
        where: { id: Number(existingLock?.id || 'temp') }, // Simplified for example
        update: { expiresAt: new Date(Date.now() + LOCK_TTL_MS), userId },
        create: { objectId, userId, expiresAt: new Date(Date.now() + LOCK_TTL_MS) }
      });

      io.to(`world:${worldId}`).emit('server:lock_acquired', { objectId, userId });
    });

    // Broadcast transform changes (throttled on client to ~15fps)
    socket.on('client:transform', ({ objectId, position, rotation, scale }) => {
      socket.to(`world:${worldId}`).emit('server:transform_update', {
        objectId, position, rotation, scale, userId
      });
    });

    // Heartbeat to extend lock
    socket.on('client:lock_heartbeat', async ({ objectId }) => {
      await prisma.objectLock.updateMany({
        where: { objectId, userId },
        data: { expiresAt: new Date(Date.now() + LOCK_TTL_MS) }
      });
    });

    socket.on('disconnect', async () => {
      // Clean up locks
      await prisma.objectLock.deleteMany({ where: { userId } });
      io.to(`world:${worldId}`).emit('server:user_left', { userId });
    });
  });
}