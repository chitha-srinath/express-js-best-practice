import { CreateTodoData, DeleteTodoData, GetTodosData, UpdateTodoData } from '@/Dtos/todo.dto';
import { getPayloadFromContext } from '@/Utilities/payload';
import { NextFunction, Request, Response } from 'express';
import { DatabaseError } from '../Utilities/ErrorUtility';
import { ResponseHandler } from '../Utilities/ResponseHandler';
import { PrismaErrorHandler } from '../Utilities/databaseErrors';
import { SuccessMessages } from '../constants/success-messages.constants';
import { TodoService } from '../services/todo.service';

/**
 * Controller for todo-related endpoints.
 * Handles todo creation, retrieval, update, and deletion operations.
 * Provides HTTP interface for todo management functionality.
 */
export class TodoController {
  private todoService: TodoService;

  /**
   * Initializes the TodoController and its TodoService dependency.
   */
  constructor() {
    this.todoService = new TodoService();
  }

  /**
   * Creates a new todo item with the provided data.
   * @param req Express request object containing todo data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async createTodo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPayloadFromContext<Omit<CreateTodoData, 'userId'>, unknown, unknown>();
      const todo = await this.todoService.createTodo(payload);
      ResponseHandler.successResponse(res, todo, SuccessMessages.TODO.CREATED, 201);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Retrieves all todo items from the system.
   * @param _req Express request object (unused)
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getAllTodos(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPayloadFromContext<
        Omit<GetTodosData, 'userId'>,
        unknown,
        unknown
      >() as GetTodosData;

      const todos = await this.todoService.getAllTodos(payload);
      ResponseHandler.successResponse(res, todos);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves a specific todo item by its ID.
   * @param _req Express request object containing todo ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async getTodoById(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPayloadFromContext<unknown, DeleteTodoData, unknown>();
      const todo = await this.todoService.getTodoById(payload);
      ResponseHandler.successResponse(res, todo);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates an existing todo item with new data.
   * @param _req Express request object containing todo ID in params and update data in body
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async updateTodo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPayloadFromContext<UpdateTodoData, DeleteTodoData, unknown>();
      const todo = await this.todoService.updateTodo(payload);
      ResponseHandler.successResponse(res, todo);
    } catch (error) {
      if (PrismaErrorHandler.handlePrismaError(error) instanceof DatabaseError) {
        return next(PrismaErrorHandler.handlePrismaError(error));
      }
      next(error);
    }
  }

  /**
   * Deletes a todo item by its ID.
   * @param _req Express request object containing todo ID in params
   * @param res Express response object
   * @param next Express next function for error handling
   */
  async deleteTodo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getPayloadFromContext<unknown, DeleteTodoData, unknown>();
      await this.todoService.deleteTodo(payload);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
}
