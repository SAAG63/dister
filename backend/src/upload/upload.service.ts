import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

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
    }
  }

  async uploadFile(userId: string, buffer: Buffer, mimetype: string): Promise<string> {
    const ext = mimetype.split('/')[1] || 'jpg';
    const objectName = `${userId}-${Date.now()}.${ext}`;
    await this.minio.putObject(BUCKET, objectName, buffer, buffer.length, { 'Content-Type': mimetype });
    return objectName;
  }

  async getFile(objectName: string): Promise<{ stream: Readable; contentType: string }> {
    const stream = await this.minio.getObject(BUCKET, objectName);
    const stat = await this.minio.statObject(BUCKET, objectName);
    return { stream, contentType: stat.metaData['content-type'] || 'image/jpeg' };
  }
}
