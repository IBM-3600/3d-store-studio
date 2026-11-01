// backend/src/scripts/cleanup-orphaned-files.ts
import { prisma} from '../config/database';
import { storageService } from '../services/storage.service';
import fs from 'fs/promises';
import path from 'path';


async function cleanupOrphanedFiles() {
  console.log('[Cleanup] Starting orphaned file cleanup...');
  
  // Get all files in uploads directory
  const uploadDir = storageService.getUploadDir();
  const allFiles = await getAllFiles(uploadDir);
  
  // Get all file paths from database
  const assets = await prisma.asset.findMany({
    select: { url: true, thumbnailUrl: true }
  });
  
  const dbFiles = new Set<string>();
  assets.forEach(asset => {
    if (asset.url) {
      dbFiles.add(asset.url.replace('/uploads/', ''));
    }
    if (asset.thumbnailUrl) {
      dbFiles.add(asset.thumbnailUrl.replace('/uploads/', ''));
    }
  });
  
  // Find orphaned files
  const orphaned = allFiles.filter(file => !dbFiles.has(file));
  
  console.log(`[Cleanup] Found ${orphaned.length} orphaned files`);
  
  // Delete orphaned files
  for (const file of orphaned) {
    try {
      await fs.unlink(path.join(uploadDir, file));
      console.log(`[Cleanup] Deleted: ${file}`);
    } catch (error) {
      console.error(`[Cleanup] Failed to delete ${file}:`, error);
    }
  }
  
  console.log('[Cleanup] Cleanup complete');
  await prisma.$disconnect();
}

async function getAllFiles(dir: string, basePath: string = ''): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      const subFiles = await getAllFiles(fullPath, relativePath);
      files.push(...subFiles);
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

cleanupOrphanedFiles().catch(console.error);