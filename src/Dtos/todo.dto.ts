import { z, object, string, boolean, number, uuid, union } from 'zod/v4';
import { BaseDto } from './base.dto';

/**
 * Zod schema for todo creation validation.
 */
export const createTodoDto = object({
  title: string().min(1, 'Title is required'),
  description: string().optional(),
}).strict();

/**
 * Zod schema for todo update validation.
 */
export const updateTodoDto = object({
  title: string().min(1, 'Title must not be empty').optional(),
  description: string().optional(),
  completed: boolean().optional(),
}).strict();

/**
 * Base schema for todo retrieval (shared fields)
 */
export const baseTodoDto = {
  limit: number({
    message: 'Limit must be a number',
  }),
  search: string().min(1, 'Search term is required').optional(),
};

/**
 * Page-based pagination
 */
const pageSchema = object({
  page: number({
    message: 'Page must be a number',
  }),
  skip: number({
    message: 'Skip must be a number',
  }),
  ...baseTodoDto,
}).strict();

/**
 * Cursor-based pagination
 */
const cursorSchema = object({
  cursor: uuid({
    message: 'Cursor must be a valid UUID',
  }),
  ...baseTodoDto,
}).strict();

/**
 * Todo retrieval DTO
 * Either page OR cursor (never both)
 */
export const getTodosDto = union([pageSchema, cursorSchema]);

/**
 * Zod schema for todo deletion validation.
 */
export const deleteTodoDto = object({
  id: uuid({
    message: 'Invalid todo ID format',
    version: 'v7',
  }),
}).strict();

/**
 * TypeScript inferred types
 */
export type CreateTodoData = z.infer<typeof createTodoDto> & BaseDto;
export type UpdateTodoData = z.infer<typeof updateTodoDto> & BaseDto;
export type DeleteTodoData = z.infer<typeof deleteTodoDto> & BaseDto;
export type GetTodosData = z.infer<typeof getTodosDto> & BaseDto;
