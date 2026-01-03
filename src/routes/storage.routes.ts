import { Router } from 'express';
import { StorageController } from '../Controllers/storage.controller';
import { validatePayload } from '../middlewares/Payload-verify';
import {
  GenerateUploadUrlDto,
  InitiateMultipartUploadDto,
  UploadPartUrlDto,
  CompleteMultipartUploadDto,
  GenerateMultipleUploadUrlsDto,
  InitiateMultipleMultipartUploadsDto,
} from '../Dtos/storage.dto';

const router = Router();
const storageController = new StorageController();

/**
 * @route POST /storage/upload-url
 * @desc Generate a presigned URL for file upload
 * @access Private
 */
router.post(
  '/upload-url',
  validatePayload({ body: GenerateUploadUrlDto }),
  storageController.generateUploadUrl,
);

/**
 * @route POST /storage/multiple-upload-urls
 * @desc Generate presigned URLs for multiple file uploads
 * @access Private
 */
router.post(
  '/multiple-upload-urls',
  validatePayload({ body: GenerateMultipleUploadUrlsDto }),
  storageController.generateMultipleUploadUrls,
);

/**
 * @route POST /storage/multipart/initiate
 * @desc Initiate a multipart upload for large files
 * @access Private
 */
router.post(
  '/multipart/initiate',
  validatePayload({ body: InitiateMultipartUploadDto }),
  storageController.initiateMultipartUpload,
);

/**
 * @route POST /storage/multipart/initiate-multiple
 * @desc Initiate multipart uploads for multiple large files
 * @access Private
 */
router.post(
  '/multipart/initiate-multiple',
  validatePayload({ body: InitiateMultipleMultipartUploadsDto }),
  storageController.initiateMultipleMultipartUploads,
);

/**
 * @route POST /storage/multipart/upload-part-url
 * @desc Generate a presigned URL for a specific part of a multipart upload
 * @access Private
 */
router.post(
  '/multipart/upload-part-url',
  validatePayload({ body: UploadPartUrlDto }),
  storageController.generateUploadPartUrl,
);

/**
 * @route POST /storage/multipart/complete
 * @desc Complete a multipart upload
 * @access Private
 */
router.post(
  '/multipart/complete',
  validatePayload({ body: CompleteMultipartUploadDto }),
  storageController.completeMultipartUpload,
);

/**
 * @route GET /storage/progress/:uploadId
 * @desc Get upload progress for a multipart upload
 * @access Private
 */
router.get('/progress/:uploadId', storageController.getUploadProgress);

/**
 * @route POST /storage/upload
 * @desc Direct file upload (simplified version)
 * @access Private
 */
router.post('/upload', storageController.uploadFile);

/**
 * @route GET /storage/download-url/:bucket/:key
 * @desc Generate a presigned URL for file download
 * @access Private
 */
router.get('/download-url/:bucket/:key', storageController.generateDownloadUrl);

export default router;
