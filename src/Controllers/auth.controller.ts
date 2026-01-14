import { NextFunction, Request, Response } from 'express';
import { BadRequestError, DatabaseError, UnauthorizedError } from '../Utilities/ErrorUtility';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { SuccessMessages } from '../constants/success-messages.constants';
import { LoginPostDto, RegisterPostDto } from '@/Dtos/auth.dto';
import { AuthService } from '../services/Authentication/Auth.service';
import { GoogleOAuthService } from '../services/Authentication/google.auth';
import { UserService } from '../services/user.service';
import { env } from '../config/config';
import { generateJwtToken } from '../Utilities/encrypt-hash';
import { randomUUID } from 'node:crypto';
import { RefreshToken } from '../constants/regular.constants';
import { UserContext } from '../Utilities/user-context';
import { ErrorMessages } from '@/constants/error-messages.constatnts';
import { SessionRepository } from '../repositories/session.repository';
import { getPublicPayloadFromContext } from '@/Utilities/payload';

// import { randomUUID } from 'crypto';

/**
 * Controller for authentication-related endpoints.
 * Handles login, registration, user fetching, and access token retrieval.
 */
export class AuthController {
  private readonly authService: AuthService;
  private readonly googleService: GoogleOAuthService;
  private readonly userService: UserService;
  private readonly sessionRepository: SessionRepository;
  /**
   * Initializes the AuthController and its AuthService dependency.
   */
  constructor() {
    this.authService = new AuthService();
    this.googleService = new GoogleOAuthService();
    this.userService = new UserService();
    this.sessionRepository = new SessionRepository();
  }

  /**
   * Handles user login.
   * @param req Express request object containing login credentials in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async login(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPublicPayloadFromContext<LoginPostDto, unknown, unknown>();
      const result = await this.authService.signIn(payload);

      //Set refresh token in secure cookie
      res.cookie(RefreshToken, result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // false locally
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/api/auth/access-token', // or "/api/auth" if you need it for multiple auth endpoints
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      ResponseHandler.successResponse(
        res,
        { token: result.accessToken },
        SuccessMessages.AUTH.LOGIN_SUCCESSFULL,
        200,
      ); // keep response message in enum or db
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Handles user registration.
   * @param req Express request object containing registration data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async register(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPublicPayloadFromContext<RegisterPostDto, unknown, unknown>();
      const result = await this.authService.signUp(payload);
      ResponseHandler.successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetches the authenticated user's details from the request.
   * @param req Express request object (should be AuthenticatedRequest)
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async fetchUserResult(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = UserContext.getUser();
      ResponseHandler.successResponse(res, result, 'user feteched sucessfully', 200);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Retrieves a new access token using the refresh token from cookies.
   * @param req Express request object (expects refreshToken cookie)
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies['refresh-token'];

      if (!token) {
        next(new UnauthorizedError('no refresh token provided'));
        return;
      }
      const result = await this.authService.fetchAcessToken(token);

      ResponseHandler.successResponse(res, result);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Logs out the authenticated user by invalidating their session.
   * @param req Express request object (should be AuthenticatedRequest)
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = UserContext.getSession();
      const sessionId = session?.id;

      if (sessionId) {
        await this.authService.logout(sessionId);
      }

      res.clearCookie(RefreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // false locally
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/api/auth/access-token', // or "/api/auth" if you need it for multiple auth endpoints
        maxAge: 0,
        expires: new Date(Date.now()),
      });

      ResponseHandler.successResponse(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  googleOauth(_req: Request, res: Response, next: NextFunction): void {
    try {
      const googleRedirectURI = this.googleService.getAuthUrl();
      res.redirect(googleRedirectURI);
    } catch (err) {
      next(err);
    }
  }
  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { code, error } = req.query;

      // Handle OAuth errors
      if (error) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_error`);
      }

      const codeStr =
        typeof code === 'string'
          ? code
          : Array.isArray(code) && typeof code[0] === 'string'
            ? code[0]
            : undefined;

      if (!codeStr) {
        return res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
      }
      const googleTokens = (await this.googleService.exchangeCodeForTokens(codeStr)) as {
        access_token: string;
      };

      // Get user info from Google
      const googleUserInfo = await this.googleService.getUserInfo(googleTokens.access_token);

      // Find or create user in your database
      const user = await this.userService.findOrCreateGoogleUser(
        googleUserInfo as { email: string; id: string; name: string; picture?: string },
      );

      // Generate your own tokens
      const sessionId = randomUUID();
      const accessToken = generateJwtToken({
        userId: user.id,
        email: user.email,
        sessionId: sessionId,
      });

      const refreshToken = generateJwtToken({
        sessionId: sessionId,
        userId: user.id,
      });

      // Save session in your database
      await this.sessionRepository.createSession(
        sessionId,
        user.id,
        refreshToken,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      );

      //Set refresh token in secure cookie
      res.cookie(RefreshToken, refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production', // false locally
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/api/auth/access-token', // or "/api/auth" if you need it for multiple auth endpoints
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${env.TOKEN_REDIRECT_URL}/?token=${accessToken}`);
    } catch (error) {
      console.error(error);
      res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }

  async forgotPassword(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = getPublicPayloadFromContext<{ email: string }, unknown, unknown>();
      await this.authService.sendPasswordResetEmail(email);
      ResponseHandler.successResponse(res, null, 'Password reset email sent', 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = getPublicPayloadFromContext<
        { token: string; newPassword: string },
        unknown,
        unknown
      >();
      await this.authService.resetPassword(token, newPassword);
      ResponseHandler.successResponse(res, null, 'Password reset successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async verifyToken(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = getPublicPayloadFromContext<{ token: string }, unknown, unknown>();
      await this.authService.verifyPasswordResetToken(token);
      ResponseHandler.successResponse(res, null, 'Token is valid', 200);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, otp } = getPublicPayloadFromContext<
        { token: string; otp: string },
        unknown,
        unknown
      >();
      await this.authService.verifyEmail(token, otp);
      ResponseHandler.successResponse(res, null, 'Email verified successfully', 200);
    } catch (error) {
      next(error);
    }
  }
  async verifyAccessToken(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!UserContext.getUser()) {
        return next(new BadRequestError(ErrorMessages.AUTH.INVALID_ACCESS_TOKEN));
      }
      ResponseHandler.successResponse(res, null, 'Access token is valid', 200);
    } catch (error) {
      next(error);
    }
  }
}
