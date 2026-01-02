/**
 * Centralized error message constants for the application.
 * Provides consistent error messages across all modules and endpoints.
 * Organized by feature area for better maintainability.
 */
export const ErrorMessages = {
  /**
   * Error messages for post-related operations.
   */
  POST: {
    POST_NOT_FOUND: 'Post not found',
    POST_CREATION_FAILED: 'Post creation failed',
    POST_UPDATE_FAILED: 'Post update failed',
    POST_DELETE_FAILED: 'Post delete failed',
  },
  /**
   * Error messages for user-related operations.
   */
  USER: {
    USER_NOT_FOUND: 'User not found in context',
    USER_CREATION_FAILED: 'User creation failed',
    USER_UPDATE_FAILED: 'User update failed',
    USER_DELETE_FAILED: 'User delete failed',
  },
  /**
   * Error messages for authentication and authorization.
   */
  AUTH: {
    BAD_REQUEST: 'Request Not Found',
    TOKEN_EXPIRED: 'Token expired',
    TOKEN_INVALID: 'Token invalid',
    TOKEN_REQUIRED: 'Token required',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    INVALID_ACCESS_TOKEN: 'Invalid access token',
  },
  /**
   * Error messages for todo-related operations.
   */
  TODO: {
    TODO_NOT_FOUND: 'Todo not found',
    TODO_CREATION_FAILED: 'Todo creation failed',
    TODO_UPDATE_FAILED: 'Todo update failed',
    TODO_DELETE_FAILED: 'Todo delete failed',
  },
};
