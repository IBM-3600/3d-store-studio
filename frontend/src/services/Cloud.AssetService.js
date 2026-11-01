// frontend/src/services/AssetService.js
import { authService } from './AuthService.js';

export class AssetService {
  constructor() {
    this.baseUrl = '/api/assets';
  }

  async upload(file, metadata, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append metadata
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      }
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress((e.loaded / e.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));

      xhr.open('POST', this.baseUrl + '/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${authService.getToken()}`);
      xhr.send(formData);
    });
  }

  async list(params = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== null && v !== undefined).reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {})
    ).toString();

    const response = await fetch(`${this.baseUrl}?${queryString}`, {
      headers: { 'Authorization': `Bearer ${authService.getToken()}` }
    });

    if (!response.ok) throw new Error('Failed to fetch assets');
    return response.json();
  }

  async get(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: { 'Authorization': `Bearer ${authService.getToken()}` }
    });

    if (!response.ok) throw new Error('Asset not found');
    return response.json();
  }

  async update(id, data) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update asset');
    return response.json();
  }

  async delete(id) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authService.getToken()}` }
    });

    if (!response.ok) throw new Error('Failed to delete asset');
    return response.json();
  }

  async getStats() {
    const response = await fetch(`${this.baseUrl}/stats/summary`, {
      headers: { 'Authorization': `Bearer ${authService.getToken()}` }
    });

    if (!response.ok) throw new Error('Failed to get stats');
    return response.json();
  }
}

export const assetService = new AssetService();