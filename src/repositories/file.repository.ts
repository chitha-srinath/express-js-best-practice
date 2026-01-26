import { File, PrismaClient, Prisma, FileStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Repository for File entity operations.
 * Extends BaseRepository to provide type-safe database operations for File model.
 * Handles all CRUD operations and advanced queries for file data.
 */
export class FileRepository extends BaseRepository<
  File,
  Prisma.FileCreateInput,
  Prisma.FileUpdateInput,
  Prisma.FileWhereInput,
  Prisma.FileWhereUniqueInput,
  PrismaClient['file']
> {
  /**
   * Initializes the FileRepository with Prisma file model.
   * Sets up the repository to work with the File entity in the database.
   */
  constructor() {
    super((prisma: PrismaClient) => prisma.file);
  }

  /**
   * Finds file by key and bucket.
   * @param key S3 key
   * @param bucket S3 bucket
   * @returns File or null
   */
  async findByKeyAndBucket(key: string, bucket: string): Promise<File | null> {
    return this.findUnique({
      key_bucket: {
        key,
        bucket,
      },
    });
  }

  /**
   * Updates file status by key and bucket.
   * @param key S3 key
   * @param bucket S3 bucket
   * @param status New status
   * @param url Optional URL
   * @param uploadedAt Optional upload timestamp
   * @returns Updated file
   */
  async updateStatusByKeyAndBucket(
    key: string,
    bucket: string,
    status: FileStatus,
    url?: string,
    uploadedAt?: Date,
  ): Promise<File> {
    // Build update data object to avoid comma operator issues
    const updateData: Partial<File> = {
      status,
      updatedAt: new Date(),
    };

    // Conditionally add properties only if they exist
    if (url) {
      updateData.url = url;
    }

    if (uploadedAt) {
      updateData.uploadedAt = uploadedAt;
    }

    return this.update(
      {
        key_bucket: {
          key,
          bucket,
        },
      },
      updateData,
    );
  }

  /**
   * Deletes file by key and bucket.
   * @param key S3 key
   * @param bucket S3 bucket
   * @returns Deleted file
   */
  async deleteByKeyAndBucket(key: string, bucket: string): Promise<File> {
    return this.deleteUnique({
      key_bucket: {
        key,
        bucket,
      },
    });
  }
}
