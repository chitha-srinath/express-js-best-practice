import { NextFunction, Request, Response } from 'express';
import { DatabaseError, NotFoundError } from '../Utilities/ErrorUtility';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { PostService } from '../services/post.service';
import { SuccessMessages } from '../constants/success-messages.constants';
import { ErrorMessages } from '../constants/error-messages.constatnts';
import { CreatePostData, UpdatePostData } from '../Dtos/post.dto';
import { getPayloadFromContext } from '@/Utilities/payload';

/**
 * Controller for post-related endpoints.
 * Handles post creation, retrieval, update, and deletion operations.
 * Provides HTTP interface for post management functionality.
 */
export class PostController {
  private readonly postService: PostService;

  /**
   * Initializes the PostController and its PostService dependency.
   */
  constructor() {
    this.postService = new PostService();
  }

  /**
   * Creates a new post with the provided data.
   * @param req Express request object containing post data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async createpost(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPayloadFromContext<Omit<CreatePostData, 'userId'>, unknown, unknown>();
      const post = await this.postService.createpost(payload);
      ResponseHandler.successResponse(res, post, SuccessMessages.POST.CREATED, 201);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Retrieves all posts from the system.
   * @param req Express request object (may contain user info)
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getAllposts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const posts = await this.postService.getAllposts();
      ResponseHandler.successResponse(res, posts, 'Fetched posts successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific post by its ID.
   * @param req Express request object containing post ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getpostById(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = getPayloadFromContext<unknown, { id: string }, unknown>();
      const post = await this.postService.getpostById(id);
      if (!post) {
        next(new NotFoundError(ErrorMessages.POST.POST_NOT_FOUND));
        return;
      }
      ResponseHandler.successResponse(res, post);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing post with new data.
   * @param req Express request object containing post ID in params and update data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async updatepost(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, ...data } = getPayloadFromContext<UpdatePostData, { id: string }, unknown>();
      const post = await this.postService.updatepost(id, data);
      ResponseHandler.successResponse(res, post);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Deletes a post by its ID.
   * @param req Express request object containing post ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async deletepost(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = getPayloadFromContext<unknown, { id: string }, unknown>();
      await this.postService.deletepost(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
}
