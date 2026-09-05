import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { ObjectStorage, StorageUploadParams, StorageObject } from './storage.interface';

@Injectable()
export class StorageService implements ObjectStorage, OnModuleInit {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'voiceflow-recordings';
    this.s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket ${this.bucket} exists.`);
    } catch (error: unknown) {
      const e = error as any;
      if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
        this.logger.log(`Bucket ${this.bucket} does not exist. Creating...`);
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.logger.log(`Bucket ${this.bucket} created successfully.`);
        } catch (createError) {
          this.logger.error(`Failed to create bucket ${this.bucket}`, createError);
        }
      } else {
        this.logger.error(`Error checking bucket ${this.bucket}`, error);
      }
    }
  }

  async upload({ key, body, mimeType }: StorageUploadParams): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to upload object ${key} to bucket ${this.bucket}`, error);
      throw new InternalServerErrorException('Failed to store recording');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete object ${key} from bucket ${this.bucket}`, error);
      // We don't throw here to prevent hiding the original error when this is used in cleanup
    }
  }

  async get(key: string): Promise<StorageObject> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      
      const byteArray = await response.Body?.transformToByteArray();
      if (!byteArray) {
        throw new Error('Response body is empty');
      }

      return {
        body: Buffer.from(byteArray),
        mimeType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      this.logger.error(`Failed to get object ${key} from bucket ${this.bucket}`, error);
      throw new InternalServerErrorException('Failed to retrieve recording');
    }
  }
}
