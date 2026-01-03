import { requireAuth } from '../Middlewares/Authentication';
import { AuthController } from '../Controllers/auth.controller';
import { Router } from 'express';
import { LoginDto, RegisterDto } from '@/Dtos/auth.dto';
import { validatePayload } from '@/Middlewares/Payload-verify';

/**
 * Router for authentication-related endpoints.
 * Handles user login, registration, user details, and token management.
 */
export class AuthRoutes {
  private router: Router;
  private readonly authController: AuthController;

  /**
   * Initializes the auth router and sets up authentication routes.
   */
  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initializeRoutes();
  }

  /**
   * Sets up all authentication-related routes.
   * Configures endpoints for login, registration, user details, and token refresh.
   */
  private initializeRoutes(): void {
    this.router.post(
      '/login',
      validatePayload({ body: LoginDto }),
      this.authController.login.bind(this.authController),
    );
    this.router.post(
      '/register',
      validatePayload({ body: RegisterDto }),
      this.authController.register.bind(this.authController),
    );
    this.router.get(
      '/user-details',
      requireAuth,
      this.authController.fetchUserResult.bind(this.authController),
    );
    this.router.get('/access-token', this.authController.getAccessToken.bind(this.authController));
    this.router.get('/logout', requireAuth, this.authController.logout.bind(this.authController));
    this.router.get('/google', this.authController.googleOauth.bind(this.authController));
    this.router.get('/google/callback', this.authController.googleLogin.bind(this.authController));
    this.router.post(
      '/forgot-password',
      this.authController.forgotPassword.bind(this.authController),
    );
    this.router.post(
      '/verify-reset-token',
      this.authController.verifyToken.bind(this.authController),
    );
    this.router.post(
      '/reset-password',
      this.authController.resetPassword.bind(this.authController),
    );

    this.router.post('/verify-email', this.authController.verifyEmail.bind(this.authController));
    this.router.get(
      '/verify-access-token',
      requireAuth,
      this.authController.verifyAccessToken.bind(this.authController),
    );
  }

  /**
   * Returns the configured Express router instance.
   * @returns Express Router instance with auth routes configured
   */
  public getRouter(): Router {
    return this.router;
  }
}
