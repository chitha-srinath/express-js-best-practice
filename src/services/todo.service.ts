import { Prisma, Todo } from '@prisma/client';
import { TodoRepository } from '../repositories/todo.repository';
import { CreateTodoData, DeleteTodoData, GetTodosData, UpdateTodoData } from '@/Dtos/todo.dto';
import { NotFoundError } from '../Utilities/ErrorUtility';

/**
 * Service for todo-related business logic.
 * Handles creation, retrieval, update, and deletion of todo items.
 * Provides a clean interface between controllers and repositories.
 */
export class TodoService {
  private todoRepository: TodoRepository;

  /**
   * Initializes the TodoService and its TodoRepository dependency.
   */
  constructor() {
    this.todoRepository = new TodoRepository();
  }

  /**
   * Creates a new todo item with the provided data.
   * @param data Data for the new todo item including title, description, and completion status
   * @returns Promise resolving to the created Todo object
   */
  async createTodo(data: CreateTodoData): Promise<Todo> {
    const { userId, ...todoData } = data;
    return this.todoRepository.insert({
      ...todoData,
      isActive: true,
      user: {
        connect: {
          id: userId,
        },
      },
    });
  }

  /**
   * Retrieves all todo items from the database.
   * @returns Promise resolving to an array of Todo objects
   */
  async getAllTodos(data: GetTodosData): Promise<{
    todos: Todo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      skip: number;
    };
  }> {
    const { userId, limit = 20, search } = data;
    let page = 1;

    if ('page' in data) {
      page = data.page;
    }

    const skip = (page - 1) * limit;

    const filterQuery = {
      userId: userId,
      ...(search && { title: { contains: search, mode: Prisma.QueryMode.insensitive } }),
      isActive: true,
    };

    const todos = await this.todoRepository.findAll(
      filterQuery,
      undefined,
      undefined,
      undefined,
      skip,
      limit,
    );
    const total = await this.todoRepository.count(filterQuery);
    return {
      todos,
      pagination: {
        page,
        limit,
        total,
        skip,
      },
    };
  }

  /**
   * Retrieves a specific todo item by its ID.
   * @param id The unique identifier of the todo item
   * @returns Promise resolving to the Todo object or null if not found
   */
  async getTodoById(id: string): Promise<Todo | null> {
    return this.todoRepository.findById(id);
  }

  /**
   * Updates an existing todo item with new data.
   * @param id The unique identifier of the todo item to update
   * @param data The new data to update the todo item with
   * @returns Promise resolving to the updated Todo object
   * @throws NotFoundError if the todo item with the given ID is not found
   */
  async updateTodo(data: UpdateTodoData & DeleteTodoData): Promise<Todo> {
    const { id, userId, ...updatedData } = data;
    const todo = await this.todoRepository.findUnique({ id, userId });
    if (!todo) {
      throw new NotFoundError('Todo not found');
    }
    return this.todoRepository.update({ id, userId }, updatedData);
  }

  /**
   * Deletes a todo item by its ID.
   * @param id The unique identifier of the todo item to delete
   * @returns Promise resolving to the deleted Todo object
   * @throws NotFoundError if the todo item with the given ID is not found
   */
  async deleteTodo(data: DeleteTodoData): Promise<Todo> {
    const todo = await this.todoRepository.findUnique({ id: data.id, userId: data.userId });

    if (!todo) {
      throw new NotFoundError('Todo not found');
    }
    return this.todoRepository.deleteUnique({ id: data.id, userId: data.userId });
  }
}
