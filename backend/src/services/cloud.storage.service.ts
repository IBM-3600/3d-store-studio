// backend/src/services/storage.service.ts
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

export class StorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    });
  }

  async generateUploadUrl(fileType: string, fileName: string): Promise<{
    uploadUrl: string;
    fileKey: string;
    publicUrl: string;
  }> {
    const fileKey = `assets/${uuidv4()}/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: fileKey,
      ContentType: fileType,
      Metadata: {
        'x-amz-meta-uploaded-by': 'studio-user' // Add custom metadata
      }
    });

    // Generate pre-signed URL (expires in 1 hour)
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600
    });

    // Public URL for accessing the file
    const publicUrl = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      fileKey,
      publicUrl
    };
  }

  async generateMultiPartUploadUrls(fileKey: string, partCount: number): Promise<string[]> {
    // For files > 100MB, use multipart upload
    // This is more complex but allows resumable uploads
    const urls: string[] = [];

    // Initiate multipart upload to get an UploadId
    const createCmd = new CreateMultipartUploadCommand({
      Bucket: config.aws.bucket,
      Key: fileKey
    });

    const createResp = await this.s3Client.send(createCmd);
    const uploadId = createResp.UploadId;
    if (!uploadId) return urls;

    for (let partNumber = 1; partNumber <= partCount; partNumber++) {
      const command = new UploadPartCommand({
        Bucket: config.aws.bucket,
        Key: fileKey,
        PartNumber: partNumber,
        UploadId: uploadId
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      urls.push(url);
    }

    return urls;
  }

  getPublicUrl(fileKey: string): string {
    return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucket,
      Key: fileKey
    });
    
    await this.s3Client.send(command);
  }
}