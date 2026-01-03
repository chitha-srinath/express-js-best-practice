import { NextFunction, Request, Response } from 'express';
import { DatabaseError, NotFoundError } from '../Utilities/ErrorUtility';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { UserService } from '../services/user.service';
import { SuccessMessages } from '../constants/success-messages.constants';
import { ErrorMessages } from '../constants/error-messages.constatnts';
import { RequestContext, UserContext } from '@/Utilities/user-context';

/**
 * Controller for user-related endpoints.
 * Handles user creation, retrieval, update, and deletion operations.
 * Provides HTTP interface for user management functionality.
 */
export class UserController {
  private userService: UserService;

  /**
   * Initializes the UserController and its UserService dependency.
   */
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Creates a new user with the provided data.
   * @param req Express request object containing user data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async createuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = {
        ...req.body,
        emailVerified: req.body.emailVerified ?? false,
      };
      const user = await this.userService.createuser(userData);
      ResponseHandler.successResponse(res, user, SuccessMessages.USER.CREATED, 201);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Retrieves all users from the system.
   * @param _req Express request object (unused)
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getAllusers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.userService.getAllusers();
      ResponseHandler.successResponse(res, users);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific user by their ID.
   * @param req Express request object containing user ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getuserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.userService.getuserById(id);
      if (!user) {
        next(new NotFoundError(ErrorMessages.USER.USER_NOT_FOUND));
        return;
      }
      ResponseHandler.successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing user with new data.
   * @param req Express request object containing user ID in params and update data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async updateuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      const data = req.body;
      const user = await this.userService.updateuser(id, data);
      ResponseHandler.successResponse(res, user);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Deletes a user by their ID.
   * @param req Express request object containing user ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async deleteuser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id;
      await this.userService.deleteuser(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = UserContext.getUser();
      if (!user?.id) {
        return next(new NotFoundError(ErrorMessages.USER.USER_NOT_FOUND));
      }
      await this.userService.changePassword(user.id, oldPassword, newPassword);
      ResponseHandler.successResponse(res, null, 'Password changed successfully', 200);
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
