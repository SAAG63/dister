import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

const BUCKET = 'avatars';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly minio: Minio.Client;

  constructor() {
    this.minio = new Minio.Client({
      endPoint: (process.env.MINIO_ENDPOINT || 'localhost').trim(),
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: (process.env.MINIO_ROOT_USER || 'minioadmin').trim(),
      secretKey: (process.env.MINIO_ROOT_PASSWORD || 'minioadmin').trim(),
    });
  }

  async onModuleInit() {
    const exists = await this.minio.bucketExists(BUCKET);
    if (!exists) {
      await this.minio.makeBucket(BUCKET);
      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        }],
      });
      await this.minio.setBucketPolicy(BUCKET, policy);
    }
  }

  async getPresignedUploadUrl(userId: string): Promise<{ uploadUrl: string; avatarUrl: string }> {
    const objectName = `${userId}-${Date.now()}.jpg`;
    let uploadUrl = await this.minio.presignedPutObject(BUCKET, objectName, 300); // 5 min expiry

    const minioPublicUrl = process.env.MINIO_PUBLIC_URL;
    if (minioPublicUrl) {
      const original = new URL(uploadUrl);
      uploadUrl = `${minioPublicUrl}${original.pathname}${original.search}`;
    }

    const minioEndpoint = minioPublicUrl || 'http://localhost:9000';
    const avatarUrl = `${minioEndpoint}/${BUCKET}/${objectName}`;

    return { uploadUrl, avatarUrl };
  }
}
