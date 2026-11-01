// studio-frontend/src/services/StudioSocket.js
import { io } from 'socket.io-client';
import { authService } from './AuthService.js';

export class StudioSocket {
  constructor(backendUrl) {
    this.socket = io(`${backendUrl}/studio`, {
      auth: {
        userId: authService.getUser().id,
        email: authService.getUser().email
      },
      transports: ['websocket'],
      autoConnect: false
    });
  }

  connect(worldId, displayName) {
    this.socket.connect();
    this.socket.once('connect', () => {
      this.socket.emit('studio:join', { worldId, displayName });
    });
  }

  // Transform events
  sendTransform(worldId, objectId, transform) {
    this.socket.emit('studio:transform', { worldId, objectId, ...transform });
  }

  // Lock management
  requestLock(worldId, objectId) {
    this.socket.emit('studio:lock_request', { worldId, objectId });
  }

  releaseLock(worldId, objectId) {
    this.socket.emit('studio:lock_release', { worldId, objectId });
  }

  // Cursor
  sendCursor(worldId, position) {
    this.socket.emit('studio:cursor', { worldId, position });
  }

  // Listeners
  onTransformReceived(cb) {
    this.socket.on('studio:transform', cb);
  }

  onLockAcquired(cb) {
    this.socket.on('studio:lock_acquired', cb);
  }

  onLockDenied(cb) {
    this.socket.on('studio:lock_denied', cb);
  }

  onLockReleased(cb) {
    this.socket.on('studio:lock_released', cb);
  }

  onUserJoined(cb) {
    this.socket.on('studio:user_joined', cb);
  }

  onUserLeft(cb) {
    this.socket.on('studio:user_left', cb);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}