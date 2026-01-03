import { Router } from 'express';
import { TodoController } from '../Controllers/todo.contoller';
import { createTodoDto, deleteTodoDto, getTodosDto, updateTodoDto } from '../Dtos/todo.dto';
import { validatePayload } from '@/middlewares/Payload-verify';

/**
 * Router for todo-related endpoints.
 * Handles todo CRUD operations for task management.
 */
export class TodoRoutes {
  private router: Router;
  private todoController: TodoController;

  /**
   * Initializes the todo router and sets up todo management routes.
   */
  constructor() {
    this.router = Router();
    this.todoController = new TodoController();
    this.initializeRoutes();
  }

  /**
   * Sets up all todo-related routes for task management.
   * Provides standard CRUD operations for todo items.
   */
  private initializeRoutes(): void {
    this.router.post(
      '/',
      validatePayload({ body: createTodoDto }),
      this.todoController.createTodo.bind(this.todoController),
    );

    this.router.post(
      '/get-todos',
      validatePayload({ body: getTodosDto }),
      this.todoController.getAllTodos.bind(this.todoController),
    );

    this.router.get('/:id', this.todoController.getTodoById.bind(this.todoController));

    this.router.put(
      '/:id',
      validatePayload({ body: updateTodoDto, params: deleteTodoDto }),
      this.todoController.updateTodo.bind(this.todoController),
    );

    this.router.delete(
      '/:id',
      validatePayload({ params: deleteTodoDto }),
      this.todoController.deleteTodo.bind(this.todoController),
    );
  }

  /**
   * Returns the configured Express router instance.
   * @returns Express Router instance with todo routes configured
   */
  public getRouter(): Router {
    return this.router;
  }
}
