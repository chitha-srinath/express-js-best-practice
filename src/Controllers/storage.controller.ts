import { NextFunction, Request, Response } from 'express';
import { S3StorageService } from '../services/storage/s3.service';
import {
  GenerateUploadUrlRequestDto,
  UploadResponseDto,
  InitiateMultipartUploadRequestDto,
  UploadPartUrlRequestDto,
  CompleteMultipartUploadRequestDto,
  GenerateMultipleUploadUrlsRequestDto,
  MultipleUploadResponseDto,
  InitiateMultipleMultipartUploadsRequestDto,
  UploadProgressResponseDto,
} from '../Dtos/storage.dto';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { DatabaseError, NotFoundError } from '../Utilities/ErrorUtility';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { env } from '../config/config';
import { RequestContext, UserContext } from '@/Utilities/user-context';
import { ErrorMessages } from '@/constants/error-messages.constatnts';

export class StorageController {
  private storageService: S3StorageService;

  constructor() {
    this.storageService = new S3StorageService();
  }

  /**
   * Generate a presigned URL for file upload
   */
  generateUploadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileName, contentType, bucket }: GenerateUploadUrlRequestDto = req.body;

      // Generate a unique key for the file
      const key = this.storageService.generateUniqueKey(fileName);

      // Generate presigned URL for upload
      const uploadUrl = await this.storageService.generateUploadUrl({
        bucket,
        key,
        contentType,
        expiresIn: 3600, // 1 hour
      });

      const response: UploadResponseDto = {
        key,
        uploadUrl,
      };

      ResponseHandler.successResponse(res, response, 'Upload URL generated successfully');
    } catch (error: unknown) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      // Type guard to ensure error is an Error instance before passing to next()
      if (error instanceof Error) {
        next(error);
      } else {
        // Handle non-Error objects
        next(new Error('Unknown error occurred'));
      }
    }
  };

  /**
   * Generate presigned URLs for multiple file uploads
   */
  generateMultipleUploadUrls = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { files, bucket }: GenerateMultipleUploadUrlsRequestDto = req.body;

      const uploadResponses: MultipleUploadResponseDto = {
        files: [],
      };

      // Generate presigned URLs for each file
      for (const file of files) {
        const key = this.storageService.generateUniqueKey(file.fileName);

        const uploadUrl = await this.storageService.generateUploadUrl({
          bucket,
          key,
          contentType: file.contentType,
          expiresIn: 3600, // 1 hour
        });

        uploadResponses.files.push({
          key,
          url: `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
          uploadUrl,
          fileName: file.fileName,
        });
      }

      ResponseHandler.successResponse(res, uploadResponses, 'Upload URLs generated successfully');
    } catch (error: unknown) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      // Type guard to ensure error is an Error instance before passing to next()
      if (error instanceof Error) {
        next(error);
      } else {
        // Handle non-Error objects
        next(new Error('Unknown error occurred'));
      }
    }
  };

  /**
   * Initiate a multipart upload for large files
   */
  initiateMultipartUpload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { fileName, contentType, bucket, fileSize }: InitiateMultipartUploadRequestDto =
        req.body;

      // Generate a unique key for the file
      const key = this.storageService.generateUniqueKey(fileName);

      // Initiate multipart upload
      const result = await this.storageService.initiateMultipartUpload(
        {
          bucket,
          key,
          contentType,
        },
        fileName,
        fileSize,
      );

      ResponseHandler.successResponse(res, result, 'Multipart upload initiated successfully');
    } catch (error: unknown) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      // Type guard to ensure error is an Error instance before passing to next()
      if (error instanceof Error) {
        next(error);
      } else {
        // Handle non-Error objects
        next(new Error('Unknown error occurred'));
      }
    }
  };

  /**
   * Initiate multipart uploads for multiple large files
   */
  initiateMultipleMultipartUploads = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { files, bucket }: InitiateMultipleMultipartUploadsRequestDto = req.body;

      const responses: Array<{ uploadId: string; key: string; fileRecord: unknown }> = [];

      // Initiate multipart uploads for each file
      for (const file of files) {
        const key = this.storageService.generateUniqueKey(file.fileName);

        const result = await this.storageService.initiateMultipartUpload(
          {
            bucket,
            key,
            contentType: file.contentType,
          },
          file.fileName,
          file.fileSize,
        );

        responses.push(result);
      }

      ResponseHandler.successResponse(
        res,
        { uploads: responses },
        'Multipart uploads initiated successfully',
      );
    } catch (error: unknown) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      // Type guard to ensure error is an Error instance before passing to next()
      if (error instanceof Error) {
        next(error);
      } else {
        // Handle non-Error objects
        next(new Error('Unknown error occurred'));
      }
    }
  };

  /**
   * Generate a presigned URL for a specific part of a multipart upload
   */
  generateUploadPartUrl = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { bucket, key, uploadId, partNumber }: UploadPartUrlRequestDto = req.body;

      // Generate presigned URL for upload part
      const uploadPartUrl = await this.storageService.generatePresignedUploadPartUrl({
        bucket,
        key,
        uploadId,
        partNumber,
        expiresIn: 3600, // 1 hour
      });

      ResponseHandler.successResponse(
        res,
        { uploadPartUrl },
        'Upload part URL generated successfully',
      );
    } catch (error: unknown) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      // Type guard to ensure error is an Error instance before passing to next()
      if (error instanceof Error) {
        next(error);
      } else {
        // Handle non-Error objects
        next(new Error('Unknown error occurred'));
      }
    }
  };

  /**
   * Complete a multipart upload
   */
  completeMultipartUpload = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { bucket, key, uploadId, parts }: CompleteMultipartUploadRequestDto = req.body;

      // Complete multipart upload
      const result = await this.storageService.completeMultipartUpload(
        bucket,
        key,
        uploadId,
        parts,
      );

      ResponseHandler.successResponse(res, result, 'Multipart upload completed successfully');
    } catch (error: unknown) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      // Type guard to ensure error is an Error instance before passing to next()
      if (error instanceof Error) {
        next(error);
      } else {
        // Handle non-Error objects
        next(new Error('Unknown error occurred'));
      }
    }
  };

  /**
   * Get upload progress for a multipart upload
   */
  getUploadProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uploadId } = req.params;
      const { bucket, key } = req.query as { bucket: string; key: string };

      // Get upload progress
      const progress = await this.storageService.getUploadProgress(uploadId, bucket, key);

      const response: UploadProgressResponseDto = {
        uploadId: progress.uploadId,
        fileName: progress.fileName,
        status: progress.status,
        progress: progress.progress,
        uploadedParts: progress.uploadedParts,
        totalParts: progress.totalParts,
        uploadedBytes: progress.uploadedBytes,
        totalBytes: progress.totalBytes,
        createdAt: progress.createdAt,
        updatedAt: progress.updatedAt,
      };

      ResponseHandler.successResponse(res, response, 'Upload progress retrieved successfully');
    } catch (error) {
      if (error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  };

  /**
   * Direct file upload endpoint
   */
  uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // For direct upload, we'll need to handle multipart form data
      // This would typically be handled by middleware like multer
      // For now, we'll assume the file is in req.body or handle it differently

      ResponseHandler.errorResponse(
        res,
        'Direct file upload not implemented. Use presigned URLs instead.',
        400,
      );
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  };

  /**
   * Generate a presigned URL for file download
   */
  generateDownloadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bucket, key } = req.params;

      const downloadUrl = await this.storageService.generateDownloadUrl({
        bucket,
        key,
        expiresIn: 3600, // 1 hour
      });

      ResponseHandler.successResponse(
        res,
        { url: downloadUrl },
        'Download URL generated successfully',
      );
    } catch (error) {
      if (error instanceof DatabaseError || error instanceof NotFoundError) {
        return next(error);
      }
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  };

  private getPayloadFromContext<T, P, Q>(): T & { userId: string } {
    const userId = UserContext.getUser()?.id;
    if (!userId) {
      throw new NotFoundError(ErrorMessages.USER.USER_NOT_FOUND);
    }

    const body = RequestContext.getBody<T>();
    const params = RequestContext.getParams<P>();
    const query = RequestContext.getQuery<Q>();

    return {
      ...(body ?? {}),
      ...(params ?? {}),
      ...(query ?? {}),
      userId,
    } as unknown as T & { userId: string };
  }
}
