import { NextFunction, Request, Response } from 'express';
import { DatabaseError, NotFoundError } from '../Utilities/ErrorUtility';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { UserService } from '../services/user.service';
import { SuccessMessages } from '../constants/success-messages.constants';
import { ErrorMessages } from '../constants/error-messages.constatnts';
import { UpdateUserData } from '@/Dtos/user.dto';
import { getPayloadFromContext } from '@/Utilities/payload';

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
  async getuserById(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = getPayloadFromContext<unknown, { id: string }, unknown>();
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
  async updateuser(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, ...data } = getPayloadFromContext<UpdateUserData, { id: string }, unknown>();
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
  async deleteuser(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = getPayloadFromContext<unknown, { id: string }, unknown>();
      await this.userService.deleteuser(id);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword, userId } = getPayloadFromContext<
        { oldPassword: string; newPassword: string },
        unknown,
        unknown
      >();

      await this.userService.changePassword(userId, oldPassword, newPassword);
      ResponseHandler.successResponse(res, null, 'Password changed successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}
