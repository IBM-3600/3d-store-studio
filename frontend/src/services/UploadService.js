// frontend/src/services/UploadService.js
import { authService } from './AuthService.js';
import { EventBus } from '../core/EventBus.js';

export class UploadService {
  constructor() {
    this.activeUploads = new Map();
  }

  /**
   * Upload file directly to backend (no S3 pre-signed URL dance)
   */
  async uploadFile(file, metadata = {}, onProgress) {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Append metadata
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const result = await this.uploadWithXHR(
        '/api/assets/upload',
        formData,
        uploadId,
        onProgress
      );

      EventBus.emit('upload:complete', {
        uploadId,
        asset: result.asset
      });

      this.activeUploads.delete(uploadId);
      return result;
    } catch (error) {
      console.error('[UploadService] Upload failed:', error);
      EventBus.emit('upload:error', { uploadId, error });
      this.activeUploads.delete(uploadId);
      throw error;
    }
  }

  uploadWithXHR(url, formData, uploadId, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      this.activeUploads.set(uploadId, { xhr });

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${authService.getToken()}`);

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
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || `Upload failed: ${xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));

      xhr.send(formData);
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
    return Array.from(this.activeUploads.keys());
  }
}

export const uploadService = new UploadService();