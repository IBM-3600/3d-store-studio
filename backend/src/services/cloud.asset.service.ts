import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config/env';

export class AssetService {
  async generateThumbnail(inputPath: string, outputPath: string, size: number = 200) {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('[AssetService] Thumbnail generation failed:', error);
      throw error;
    }
  }

  async optimizeImage(inputPath: string, outputPath: string) {
    try {
      await sharp(inputPath)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 85 })
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      console.error('[AssetService] Image optimization failed:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string) {
    try {
      const fullPath = path.join(config.uploadDir, path.basename(filePath));
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('[AssetService] File deletion failed:', error);
      throw error;
    }
  }

  async getFileStats(filePath: string) {
    try {
      const fullPath = path.join(config.uploadDir, path.basename(filePath));
      const stats = await fs.stat(fullPath);
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      console.error('[AssetService] Get file stats failed:', error);
      throw error;
    }
  }
}