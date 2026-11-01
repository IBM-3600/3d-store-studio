import { PrismaClient, PublishStatus } from '../generated/prisma/client';
import { config } from '../config/env';
import {prisma} from '../config/database';

export class PublishService {
  async publishWorld(worldId: string, userId: string, sceneJson: any) {
    // 1. Validation
    await this.validateScene(sceneJson);

    // 2. Upload to CDN (simulated - in production, use AWS S3, Cloudflare R2, etc.)
    const fileName = `worlds/${worldId}/v${Date.now()}.json`;
    const cdnUrl = await this.uploadToCDN(fileName, JSON.stringify(sceneJson));

    // 3. Get current version
    const world = await prisma.world.findUnique({ where: { id: Number(worldId) } });
    const newVersion = (world?.version || 0) + 1;

    // 4. Create version record and update world
    const [updatedWorld, versionRecord] = await prisma.$transaction([
      prisma.world.update({
        where: { id: Number(worldId) },
        data: {
          status: PublishStatus.PUBLISHED,
          version: newVersion
        }
      }),
      prisma.publishVersion.create({
        data: {
          worldId: Number(worldId),
          version: newVersion,
          snapshotUrl: cdnUrl,
          publishedBy: userId
        }
      })
    ]);

    // 5. Log audit
    await prisma.auditLog.create({
      data: {
        userId: Number(userId),
        action: 'PUBLISH_WORLD',
        target: worldId
      }
    });

    return {
      success: true,
      version: newVersion,
      url: cdnUrl
    };
  }

  private async validateScene(sceneJson: any) {
    // Check for invalid transforms
    const hasInvalidTransforms = sceneJson.instances?.some((inst: any) =>
      isNaN(inst.transform?.position?.x) ||
      isNaN(inst.transform?.position?.y) ||
      isNaN(inst.transform?.position?.z)
    );

    if (hasInvalidTransforms) {
      throw new Error('Validation failed: Scene contains invalid transform data (NaN)');
    }

    // Check for missing required fields
    const hasMissingFields = sceneJson.instances?.some((inst: any) =>
      !inst.id || !inst.transform
    );

    if (hasMissingFields) {
      throw new Error('Validation failed: Scene contains instances with missing required fields');
    }

    // Add more validation as needed
  }

  private async uploadToCDN(fileName: string, content: string): Promise<string> {
    // In production, implement actual CDN upload (S3, R2, etc.)
    // For now, return a mock URL
    const cdnBaseUrl = config.cdnBaseUrl;
    return `${cdnBaseUrl}/${fileName}`;
  }

}