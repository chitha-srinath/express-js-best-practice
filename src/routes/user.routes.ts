import { Router } from 'express';
import { UserController } from '../Controllers/user.controller';
import { createUserDto } from '../Dtos/user.dto';
import { validatePayload } from '../middlewares/Payload-verify';
import { requireAuth } from '@/middlewares/Authentication';

/**
 * Router for user-related endpoints.
 * Handles user CRUD operations with payload validation.
 */
export class UserRoutes {
  private router: Router;
  private userController: UserController;

  /**
   * Initializes the user router and sets up user management routes.
   */
  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  /**
   * Sets up all user-related routes with appropriate middleware.
   * Includes payload validation for user creation and standard CRUD operations.
   */
  private initializeRoutes(): void {
    this.router.post(
      '/',
      validatePayload({ body: createUserDto }),
      this.userController.createuser.bind(this.userController),
    );
    this.router.get('/', this.userController.getAllusers.bind(this.userController));
    this.router.get('/:id', this.userController.getuserById.bind(this.userController));
    this.router.put('/:id', this.userController.updateuser.bind(this.userController));
    this.router.delete('/:id', this.userController.deleteuser.bind(this.userController));
    this.router.post(
      '/change-password',
      requireAuth,
      this.userController.changePassword.bind(this.userController),
    );
  }

  /**
   * Returns the configured Express router instance.
   * @returns Express Router instance with user routes configured
   */
  public getRouter(): Router {
    return this.router;
  }
}
