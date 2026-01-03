import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import {
  UploadParams,
  PresignedUrlParams,
  MultipartUploadParams,
  PresignedUploadPartParams,
  FileMetadata,
  UploadProgress,
} from '../../interface/file.interface';
import { FileRepository } from '../../repositories/file.repository';
import { env } from '../../config/config';
import { NotFoundError } from '../../Utilities/ErrorUtility';

export class S3StorageService {
  private s3Client: S3Client;
  private fileRepository: FileRepository;

  constructor() {
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.fileRepository = new FileRepository();
  }

  /**
   * Generate a presigned URL for uploading a file
   * presignded URL send to client, which can be used to upload the file without backend
   */
  async generateUploadUrl(params: PresignedUrlParams): Promise<string> {
    // Build metadata object to avoid comma operator issues
    const metadata: Record<string, string> = {
      uploadedAt: new Date().toISOString(),
    };

    // Add any additional metadata if provided
    if (params.metadata) {
      Object.assign(metadata, params.metadata);
    }

    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
      Metadata: metadata,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: params.expiresIn || 3600, // 1 hour default
    });

    return url;
  }

  /**
   * Generate presigned URLs for uploading multiple files
   */
  async generateMultipleUploadUrls(params: PresignedUrlParams[]): Promise<string[]> {
    const urls: Promise<string>[] = [];

    for (const param of params) {
      urls.push(this.generateUploadUrl(param));
    }

    return Promise.all(urls);
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async generateDownloadUrl(params: PresignedUrlParams): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: params.expiresIn || 3600, // 1 hour default
    });

    return url;
  }

  /**
   * Direct upload a file buffer to S3
   * file send to backend(here) and then uploaded to S3
   */
  async uploadFileBuffer(
    buffer: Buffer,
    params: UploadParams,
    fileName: string,
  ): Promise<{ key: string; url: string; fileRecord: FileMetadata }> {
    // Build metadata object to avoid comma operator issues
    const metadata: Record<string, string> = {
      uploadedAt: new Date().toISOString(),
    };

    // Add any additional metadata if provided
    if (params.metadata) {
      Object.assign(metadata, params.metadata);
    }

    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: buffer,
      ContentType: params.contentType,
      Metadata: metadata,
    });

    await this.s3Client.send(command);

    // Generate public URL for the uploaded file
    const url = `https://${params.bucket}.s3.${env.AWS_REGION}.amazonaws.com/${params.key}`;

    // Store file metadata in database
    const fileRecord = await this.fileRepository.insert({
      id: randomUUID(),
      name: fileName,
      size: buffer.length,
      mimeType: params.contentType,
      key: params.key,
      bucket: params.bucket,
      url: url,
      status: 'completed',
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      key: params.key,
      url,
      fileRecord: {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        key: fileRecord.key,
        bucket: fileRecord.bucket,
        url: fileRecord.url,
        status: fileRecord.status,
        uploadedAt: fileRecord.uploadedAt,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
      },
    };
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);

    // Delete file record from database
    await this.fileRepository.deleteByKeyAndBucket(key, bucket);
  }

  /**
   * Generate a unique file key
   */
  generateUniqueKey(fileName: string): string {
    const ext = fileName.split('.').pop();
    return `${randomUUID()}-${fileName.split('.')[0].length > 20 ? fileName.split('.')[0].substring(0, 20) + '...' : fileName.split('.')[0]}.${ext}`;
  }

  /**
   * Initiate a multipart upload for large files
   */
  async initiateMultipartUpload(
    params: MultipartUploadParams,
    fileName: string,
    fileSize?: number,
  ): Promise<{ uploadId: string; key: string; fileRecord: FileMetadata }> {
    // Build metadata object to avoid comma operator issues
    const metadata: Record<string, string> = {
      uploadedAt: new Date().toISOString(),
    };

    // Add any additional metadata if provided
    if (params.metadata) {
      Object.assign(metadata, params.metadata);
    }

    const command = new CreateMultipartUploadCommand({
      Bucket: params.bucket,
      Key: params.key,
      ContentType: params.contentType,
      Metadata: metadata,
    });

    const response = await this.s3Client.send(command);

    // Store file metadata in database with pending status
    const fileRecord = await this.fileRepository.insert({
      id: randomUUID(),
      name: fileName,
      size: fileSize,
      mimeType: params.contentType,
      key: params.key,
      bucket: params.bucket,
      url: '', // Will be updated when upload completes
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      uploadId: response.UploadId!,
      key: params.key,
      fileRecord: {
        id: fileRecord.id,
        name: fileRecord.name,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        key: fileRecord.key,
        bucket: fileRecord.bucket,
        url: fileRecord.url,
        status: fileRecord.status,
        uploadedAt: fileRecord.uploadedAt,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
      },
    };
  }

  /**
   * Generate a presigned URL for a specific part of a multipart upload
   */
  async generatePresignedUploadPartUrl(params: PresignedUploadPartParams): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: params.bucket,
      Key: params.key,
      UploadId: params.uploadId,
      PartNumber: params.partNumber,
    });

    const url = await getSignedUrl(this.s3Client, command, {
      expiresIn: params.expiresIn || 3600, // 1 hour default
    });

    return url;
  }

  /**
   * Complete a multipart upload
   */
  async completeMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<{ key: string; url: string; fileRecord: FileMetadata }> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await this.s3Client.send(command);

    // Generate public URL for the uploaded file
    const url = `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    // Update file record in database to completed status
    const updatedFileRecord = await this.fileRepository.updateStatusByKeyAndBucket(
      key,
      bucket,
      'completed',
      url,
      new Date(),
    );

    return {
      key,
      url,
      fileRecord: {
        id: updatedFileRecord.id,
        name: updatedFileRecord.name,
        size: updatedFileRecord.size,
        mimeType: updatedFileRecord.mimeType,
        key: updatedFileRecord.key,
        bucket: updatedFileRecord.bucket,
        url: updatedFileRecord.url,
        status: updatedFileRecord.status,
        uploadedAt: updatedFileRecord.uploadedAt,
        createdAt: updatedFileRecord.createdAt,
        updatedAt: updatedFileRecord.updatedAt,
      },
    };
  }

  /**
   * Abort a multipart upload
   */
  async abortMultipartUpload(bucket: string, key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    });

    await this.s3Client.send(command);

    // Update file record in database to failed status
    await this.fileRepository.updateStatusByKeyAndBucket(key, bucket, 'failed');
  }

  /**
   * Get upload progress for a multipart upload
   */
  async getUploadProgress(uploadId: string, bucket: string, key: string): Promise<UploadProgress> {
    // Get file record from database
    const fileRecord = await this.fileRepository.findByKeyAndBucket(key, bucket);

    if (!fileRecord) {
      throw new NotFoundError('File record not found');
    }

    // For completed or failed uploads, return stored status
    if (fileRecord.status === 'completed' || fileRecord.status === 'failed') {
      return {
        uploadId,
        fileName: fileRecord.name,
        status: fileRecord.status as 'completed' | 'failed',
        progress: fileRecord.status === 'completed' ? 100 : 0,
        uploadedBytes: fileRecord.size || 0,
        totalBytes: fileRecord.size || 0,
        createdAt: fileRecord.createdAt,
        updatedAt: fileRecord.updatedAt,
      };
    }

    // For pending or uploading files, we can't get exact progress without additional tracking
    // In a real implementation, you would track uploaded parts
    return {
      uploadId,
      fileName: fileRecord.name,
      status: 'pending',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: fileRecord.size || 0,
      createdAt: fileRecord.createdAt,
      updatedAt: fileRecord.updatedAt,
    };
  }

  /**
   * Update upload progress
   */
  async updateUploadProgress(
    uploadId: string,
    bucket: string,
    key: string,
    _uploadedParts: number,
    _totalParts: number,
  ): Promise<void> {
    // const progress = Math.round((_uploadedParts / _totalParts) * 100);

    // Update file record in database with progress information
    // Note: In a real implementation, you might want to store progress in a separate table
    await this.fileRepository.updateStatusByKeyAndBucket(key, bucket, 'pending');
  }
}
