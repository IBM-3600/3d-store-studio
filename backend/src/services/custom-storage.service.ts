// backend/src/services/custom-storage.service.ts
import { prisma } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';


export interface CustomStorageConfig {
  baseUrl: string;
  apiKey?: string;
  authType: 'bearer' | 'apikey' | 'basic' | 'none';
  authHeader: string;
  uploadEndpoint: string;
  deleteEndpoint: string;
  listEndpoint?: string;
  publicUrlBase?: string;
  urlPattern: string;
  forceHttps: boolean;
  customHeaders?: Record<string, string>;
}

export class CustomStorageService {
  private config: CustomStorageConfig | null = null;
  private httpClient: AxiosInstance | null = null;

  /**
   * Initialize from database settings
   */
  async initialize(): Promise<boolean> {
    try {
      const settings = await prisma.storageSettings.findFirst({
        where: { isActive: true }
      });

      if (!settings || !settings.baseUrl) {
        console.log('[CustomStorage] No active configuration found');
        return false;
      }

      this.config = {
        baseUrl: settings.baseUrl.replace(/\/$/, ''), // Remove trailing slash
        apiKey: settings.apiKey || undefined,
        authType: (settings.authType as any) || 'bearer',
        authHeader: settings.authHeader || 'Authorization',
        uploadEndpoint: settings.uploadEndpoint || '/upload',
        deleteEndpoint: settings.deleteEndpoint || '/objects',
        listEndpoint: settings.listEndpoint || undefined,
        publicUrlBase: settings.publicUrlBase || undefined,
        urlPattern: settings.urlPattern || '{baseUrl}/{key}',
        forceHttps: settings.forceHttps ?? true,
        customHeaders: settings.customHeaders ? JSON.parse(settings.customHeaders as string) : undefined
      };

      // Create axios instance with auth
      this.httpClient = axios.create({
        baseURL: this.config.baseUrl,
        timeout: 60000, // 60 seconds for large uploads
        headers: this.buildHeaders()
      });

      console.log('[CustomStorage] Initialized:', this.config.baseUrl);
      return true;
    } catch (error) {
      console.error('[CustomStorage] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Build authentication headers
   */
  private buildHeaders(): Record<string, string> {
    if (!this.config) return {};

    const headers: Record<string, string> = {
      ...this.config.customHeaders
    };

    if (this.config.apiKey) {
      switch (this.config.authType) {
        case 'bearer':
          headers[this.config.authHeader] = `Bearer ${this.config.apiKey}`;
          break;
        case 'apikey':
          headers[this.config.authHeader] = this.config.apiKey;
          break;
        case 'basic':
          headers[this.config.authHeader] = `Basic ${Buffer.from(this.config.apiKey).toString('base64')}`;
          break;
        case 'none':
          // No auth
          break;
      }
    }

    return headers;
  }

  isConfigured(): boolean {
    return this.httpClient !== null && this.config !== null;
  }

  /**
   * Upload file to custom CDN
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    subfolder: string = '',
    contentType?: string,
    onProgress?: (progress: number) => void
  ): Promise<{
    storageKey: string;
    publicUrl: string;
    size: number;
    response?: any;
  }> {
    if (!this.httpClient || !this.config) {
      throw new Error('Custom storage service not initialized');
    }

    // Generate unique key
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const uniqueName = `${baseName}_${uuidv4().slice(0, 8)}${ext}`;
    const storageKey = subfolder ? `${subfolder}/${uniqueName}` : uniqueName;

    try {
      // Prepare FormData for upload
      const formData = new FormData();
      
      // Create a Blob from buffer for FormData
      const blob = new Blob([buffer], { type: contentType || 'application/octet-stream' });
      formData.append('file', blob, originalName);
      formData.append('key', storageKey);
      formData.append('folder', subfolder);

      // Make upload request
      const response = await this.httpClient.post(
        this.config.uploadEndpoint,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(percent);
            }
          }
        }
      );

      // Build public URL
      const publicUrl = this.buildPublicUrl(storageKey, response.data);

      return {
        storageKey,
        publicUrl,
        size: buffer.length,
        response: response.data
      };

    } catch (error: any) {
      console.error('[CustomStorage] Upload failed:', error.response?.data || error.message);
      throw new Error(`Upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Build public URL for uploaded file
   */
  private buildPublicUrl(storageKey: string, apiResponse?: any): string {
    if (!this.config) return '';

    // If API returns a URL, use it
    if (apiResponse?.url) return apiResponse.url;
    if (apiResponse?.publicUrl) return apiResponse.publicUrl;
    if (apiResponse?.data?.url) return apiResponse.data.url;

    // Otherwise, construct from pattern
    const baseUrl = this.config.publicUrlBase || this.config.baseUrl;
    
    return this.config.urlPattern
      .replace('{baseUrl}', baseUrl)
      .replace('{key}', storageKey);
  }

  /**
   * Delete file from custom CDN
   */
  async deleteFile(storageKey: string): Promise<void> {
    if (!this.httpClient || !this.config) {
      throw new Error('Custom storage service not initialized');
    }

    try {
      // Support different delete patterns
      const deleteUrl = this.config.deleteEndpoint.includes('{key}')
        ? this.config.deleteEndpoint.replace('{key}', storageKey)
        : `${this.config.deleteEndpoint}/${storageKey}`;

      await this.httpClient.delete(deleteUrl);
      console.log(`[CustomStorage] Deleted: ${storageKey}`);
    } catch (error: any) {
      console.error(`[CustomStorage] Delete failed for ${storageKey}:`, error.message);
      // Don't throw - file might already be deleted
    }
  }

  /**
   * Test connection to custom CDN
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.httpClient || !this.config) {
      return { success: false, message: 'Custom storage not configured' };
    }

    try {
      // Try a simple GET request to base URL or list endpoint
      const testEndpoint = this.config.listEndpoint || '/health' || '/';
      
      const response = await this.httpClient.get(testEndpoint, {
        timeout: 10000
      });

      return { 
        success: true, 
        message: `Connected successfully (Status: ${response.status})` 
      };
    } catch (error: any) {
      // Some APIs return 404 for root but are still reachable
      if (error.response && error.response.status < 500) {
        return { 
          success: true, 
          message: `Server reachable (Status: ${error.response.status})` 
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Connection failed' 
      };
    }
  }

  /**
   * Get configuration (for debugging)
   */
  getConfig(): CustomStorageConfig | null {
    return this.config;
  }
}

export const customStorageService = new CustomStorageService();