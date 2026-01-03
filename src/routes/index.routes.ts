import { Router } from 'express';
import { TodoRoutes } from './todo.routes';
import { PostRoutes } from './post.routes';
import { UserRoutes } from './user.routes';
import { AuthRoutes } from './auth.routes';
import StorageRoutes from './storage.routes';
import { requireAuth } from '../Middlewares/Authentication';

/**
 * Main application router that combines all feature-specific routes.
 * Provides centralized route management and organization for the API.
 */
export class AppRouter {
  private router: Router;

  /**
   * Initializes the main router and sets up all application routes.
   */
  constructor() {
    this.router = Router();

    this.initializeRoutes();
  }

  /**
   * Sets up all feature-specific routes under their respective prefixes.
   * Organizes routes by functionality for better maintainability.
   */
  private initializeRoutes(): void {
    this.router.use('/todos', requireAuth, new TodoRoutes().getRouter());
    this.router.use('/posts', requireAuth, new PostRoutes().getRouter());
    this.router.use('/users', new UserRoutes().getRouter());
    this.router.use('/auth', new AuthRoutes().getRouter());
    this.router.use('/storage', StorageRoutes);
  }

  /**
   * Returns the configured Express router instance.
   * @returns Express Router instance with all routes configured
   */
  public getRouter(): Router {
    return this.router;
  }
}

export default new AppRouter().getRouter();
