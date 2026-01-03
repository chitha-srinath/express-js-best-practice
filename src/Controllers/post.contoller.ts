import { NextFunction, Request, Response } from 'express';
import { DatabaseError, NotFoundError } from '../Utilities/ErrorUtility';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { PostService } from '../services/post.service';
import { SuccessMessages } from '../constants/success-messages.constants';
import { ErrorMessages } from '../constants/error-messages.constatnts';
import { CreatePostData } from '../Dtos/post.dto';
import { RequestContext, UserContext } from '@/Utilities/user-context';

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
  async createpost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = UserContext.getUser()?.id;
      if (!userId) {
        throw new NotFoundError(ErrorMessages.USER.USER_NOT_FOUND);
      }
      const payload: CreatePostData = {
        ...req.body,
        userId,
      };
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
  async getAllposts(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  async getpostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
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
  async updatepost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const data = req.body;
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
  async deletepost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      await this.postService.deletepost(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }

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
