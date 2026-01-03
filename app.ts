import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { GlobalErrorHandler } from './src/Middlewares/GlobalErrorHandler';
import { NotFoundError } from './src/Utilities/ErrorUtility';
import helmet from 'helmet';
import indexRoutes from './src/routes/index.routes';
import limiter from './src/utils/rate-limit';
// import { toNodeHandler } from 'better-auth/node';
// import { auth } from './auth';
import { env } from './src/config/config';
import { PrismaErrorHandler } from './src/Utilities/databaseErrors';
import cookieParser from 'cookie-parser';

/**
 * Main application class that configures and initializes the Express server.
 * Handles middleware setup, route configuration, and error handling.
 */
export class App {
  public readonly app: Express;

  /**
   * Initializes the Express application with all necessary configurations.
   * Sets up middleware, routes, and error handling in the correct order.
   */
  constructor() {
    this.app = express();
    this.initializeLogger();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initializes the logger for Prisma error handling.
   * Sets up the logger instance that will be used throughout the application.
   */
  private initializeLogger(): void {
    const logger = GlobalErrorHandler.logger;
    PrismaErrorHandler.setLogger(logger);
  }

  /**
   * Configures all middleware for the Express application.
   * Sets up CORS, security headers, rate limiting, and other essential middleware.
   */
  private initializeMiddlewares(): void {
    this.app.use(
      cors({
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
      }),
    );
    this.app.disable('x-powered-by');
    this.app.use(helmet());
    this.app.use(limiter);
    this.app.use(cookieParser('wgyfwugfuwhfhkw'));
  }

  /**
   * Sets up all application routes including authentication, health check, and API routes.
   * Configures the routing structure for the entire application.
   */
  private initializeRoutes(): void {
    // this.app.all('/api/auth/*authPath', toNodeHandler(auth));
    this.app.use(express.json());
    this.app.get('/api/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'healthy' });
    });
    this.app.use('/api', indexRoutes);
  }

  /**
   * Configures global error handling middleware.
   * Sets up catch-all route for 404 errors and global error handler.
   */
  private initializeErrorHandling(): void {
    // 404 handler - must be after all other routes
    this.app.use((req: Request, _: Response, next: NextFunction) => {
      next(new NotFoundError(`Route ${req.originalUrl} not found`));
    });
    this.app.use(GlobalErrorHandler.handleErrors);
  }
}
