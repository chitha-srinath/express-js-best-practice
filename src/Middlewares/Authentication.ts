import { NextFunction, Request, Response } from 'express';
import { UserDetails } from '../interface/user.interface';
import { UnauthorizedError } from '../Utilities/ErrorUtility';
import { verifyJwtToken } from '../Utilities/encrypt-hash';
import { ErrorMessages } from '../constants/error-messages.constatnts';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { UserContext } from '../Utilities/user-context';
import { GlobalErrorHandler } from './GlobalErrorHandler';

/**
 * Middleware that validates JWT authentication tokens.
 * Extracts the token from the Authorization header, verifies it, and attaches user data to the request.
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 * @returns Promise that resolves to void or Response
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void | Response> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new UnauthorizedError(ErrorMessages.AUTH.TOKEN_REQUIRED));
    }

    let payload;
    try {
      payload = await verifyJwtToken(token);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'name' in err) {
        const errorName = (err as { name: string }).name;
        if (errorName === 'TokenExpiredError') {
          return next(new UnauthorizedError(ErrorMessages.AUTH.TOKEN_EXPIRED));
        } else if (errorName === 'JsonWebTokenError') {
          return next(new UnauthorizedError(ErrorMessages.AUTH.TOKEN_INVALID));
        }
      }
      return next(new UnauthorizedError('Invalid authentication'));
    }

    const userData: UserDetails = {
      username: payload.userId,
      id: payload.userId,
      avatarUrl: '',
      email: payload.email,
    };

    // Use AsyncLocalStorage to store user context for this request
    UserContext.run({ user: userData, session: payload.session }, () => next());
  } catch (error) {
    GlobalErrorHandler.logger.error(
      `Auth middleware error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    return ResponseHandler.errorResponse(res, 'Invalid authentication', 401);
  }
};
