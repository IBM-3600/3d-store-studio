// frontend/src/services/AssetService.js
import { authService } from './AuthService.js';
import { uploadService } from './UploadService.js';

export class AssetService {
  constructor() {
    this.baseUrl = '/api/assets';
  }

  /**
   * Upload file with metadata - uses direct upload (no S3)
   */
  async upload(file, metadata = {}, onProgress) {
    return uploadService.uploadFile(file, metadata, onProgress);
  }

  async list(params = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .reduce((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {})
    ).toString();

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
   
    const response = await fetch(url, {
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

  // frontend/src/services/AssetService.js — add this method to the class

  /**
   * Register an externally-hosted asset (no file upload).
   * The backend will validate the URL and create the asset record.
   */
  async registerExternalUrl(url, metadata = {}) {
    const response = await fetch(`${this.baseUrl}/register-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      },
      body: JSON.stringify({ url, metadata })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to register URL');
    }

    return response.json();
  }

}

export const assetService = new AssetService();