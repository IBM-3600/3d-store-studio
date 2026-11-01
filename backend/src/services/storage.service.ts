// backend/src/services/storage.service.ts
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(config.uploadDir);
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log(`[StorageService] Upload directory ready: ${this.uploadDir}`);
    } catch (error) {
      console.error('[StorageService] Failed to create upload directory:', error);
      throw error;
    }
  }

  /**
   * Save a file to local storage
   * @param buffer File content as buffer
   * @param originalName Original file name
   * @param subfolder Optional subfolder (e.g., 'models', 'textures')
   * @returns Object with file path and public URL
   */
  async saveFile(
    buffer: Buffer,
    originalName: string,
    subfolder: string = ''
  ): Promise<{
    fileKey: string;
    publicUrl: string;
    fullPath: string;
    size: number;
  }> {

    // Validate inputs
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
    if (!originalName) {
      throw new Error('Original filename is required');
    }
    
    // Generate unique filename
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${baseName}_${uuidv4().slice(0, 8)}${ext}`;
    
    // Build path with optional subfolder
    const relativePath = subfolder ? `${subfolder}/${uniqueName}` : uniqueName;
    const fullPath = path.join(this.uploadDir, relativePath);
    
    // Ensure subfolder exists
    const dirPath = path.dirname(fullPath);
    await fs.mkdir(dirPath, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, buffer);
    
    // Build public URL
    const publicUrl = subfolder 
      ? `/uploads/${subfolder}/${uniqueName}`
      : `/uploads/${uniqueName}`;
    
    return {
      fileKey: relativePath,
      publicUrl,
      fullPath,
      size: buffer.length
    };
  }

  /**
   * Save a file from a temporary path (used with Multer)
   */
  async saveFromTemp(
    tempPath: string,
    originalName: string,
    subfolder: string = ''
  ): Promise<{
    fileKey: string;
    publicUrl: string;
    fullPath: string;
    size: number;
  }> {
    const buffer = await fs.readFile(tempPath);
    return this.saveFile(buffer, originalName, subfolder);
  }

  /**
   * Delete a file from local storage
   */
  async deleteFile(fileKey: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, fileKey);
    try {
      await fs.unlink(fullPath);
      console.log(`[StorageService] Deleted: ${fileKey}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`[StorageService] File not found: ${fileKey}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(fileKey: string): Promise<boolean> {
    const fullPath = path.join(this.uploadDir, fileKey);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(fileKey: string) {
    const fullPath = path.join(this.uploadDir, fileKey);
    const stats = await fs.stat(fullPath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  }

  /**
   * Get total storage used
   */
  async getTotalStorage(): Promise<number> {
    return this.calculateDirSize(this.uploadDir);
  }

  private async calculateDirSize(dirPath: string): Promise<number> {
    let totalSize = 0;
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          totalSize += await this.calculateDirSize(fullPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error('[StorageService] Error calculating dir size:', error);
    }
    
    return totalSize;
  }

  /**
   * Get the absolute path for a file key
   */
  getAbsolutePath(fileKey: string): string {
    return path.join(this.uploadDir, fileKey);
  }

  /**
   * Get the upload directory path
   */
  getUploadDir(): string {
    return this.uploadDir;
  }
}

export const storageService = new StorageService();