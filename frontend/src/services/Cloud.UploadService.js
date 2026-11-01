// frontend/src/services/UploadService.js
import { ApiService } from './ApiService.js';
import { EventBus } from '../core/EventBus.js';

export class UploadService {
  constructor() {
    this.api = new ApiService();
    this.activeUploads = new Map();
  }

  async uploadFile(file, onProgress) {
    const uploadId = `upload_${Date.now()}_${Math.random()}`;
    
    try {
      // Step 1: Request upload URL from backend
      const { uploadUrl, fileKey, assetId, publicUrl } = await this.api.post('/api/upload/request-upload', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      // Step 2: Upload directly to S3
      await this.uploadToS3(uploadUrl, file, uploadId, onProgress);

      // Step 3: Confirm upload completion
      const result = await this.api.post('/api/upload/confirm-upload', {
        assetId,
        fileKey
      });

      // Notify success
      EventBus.emit('upload:complete', {
        uploadId,
        asset: result.asset,
        publicUrl
      });

      this.activeUploads.delete(uploadId);

      return result.asset;
    } catch (error) {
      console.error('[UploadService] Upload failed:', error);
      EventBus.emit('upload:error', { uploadId, error });
      this.activeUploads.delete(uploadId);
      throw error;
    }
  }

  async uploadToS3(uploadUrl, file, uploadId, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      this.activeUploads.set(uploadId, { xhr, file });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);

      // Progress tracking
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = (e.loaded / e.total) * 100;
          
          if (onProgress) {
            onProgress(percent, e.loaded, e.total);
          }

          EventBus.emit('upload:progress', {
            uploadId,
            percent,
            loaded: e.loaded,
            total: e.total
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload aborted'));

      xhr.send(file);
    });
  }

  cancelUpload(uploadId) {
    const upload = this.activeUploads.get(uploadId);
    if (upload) {
      upload.xhr.abort();
      this.activeUploads.delete(uploadId);
      EventBus.emit('upload:cancelled', { uploadId });
    }
  }

  getActiveUploads() {
    return Array.from(this.activeUploads.entries()).map(([id, data]) => ({
      id,
      fileName: data.file.name,
      fileSize: data.file.size
    }));
  }
}

export const uploadService = new UploadService();