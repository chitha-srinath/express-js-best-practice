import { PrismaClient } from '@prisma/client';
import { prismaConnection } from '../utils/database';

/**
 * Interface defining the common methods of a Prisma Delegate.
 * This allows the BaseRepository to interact with any Prisma model in a type-safe way
 * without manual casting in every method.
 */
export interface PrismaModelDelegate<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput> {
  create(args: { data: CreateInput }): Promise<T>;
  createMany(args: { data: CreateInput[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
  upsert(args: { where: WhereUniqueInput; update: UpdateInput; create: CreateInput }): Promise<T>;
  findMany<R = T>(args?: {
    where?: WhereInput;
    select?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
  }): Promise<R[]>;
  findUnique<R = T>(args: {
    where: WhereUniqueInput;
    select?: Record<string, unknown>;
    include?: Record<string, unknown>;
  }): Promise<R | null>;
  findFirst<R = T>(args?: {
    where?: WhereInput;
    select?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    skip?: number;
    take?: number;
  }): Promise<R | null>;
  update(args: {
    where: WhereUniqueInput;
    data: UpdateInput;
    select?: Record<string, unknown>;
    include?: Record<string, unknown>;
  }): Promise<T>;
  updateMany(args: { where: WhereInput; data: UpdateInput; limit?: number }): Promise<{
    count: number;
  }>;
  delete(args: { where: WhereUniqueInput }): Promise<T>;
  deleteMany(args: { where?: WhereInput }): Promise<{ count: number }>;
  count(args?: { where?: WhereInput }): Promise<number>;
  groupBy?(args: {
    by: string[];
    _count?: boolean;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
  }): Promise<unknown>;
  aggregate?(args: {
    _count?: boolean;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
  }): Promise<unknown>;
}

/**
 * Generic base repository for Prisma models.
 * Provides common CRUD and utility operations for any entity.
 * @template T Entity type
 * @template CreateInput Prisma create input type
 * @template UpdateInput Prisma update input type
 * @template WhereInput Prisma where input type
 * @template WhereUniqueInput Prisma where unique input type
 * @template M Prisma model type
 */
export class BaseRepository<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput, M> {
  protected prisma: PrismaClient;
  protected model: PrismaModelDelegate<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput>;

  /**
   * Initializes the repository with a Prisma model selector.
   * @param modelSelector Function to select the Prisma model from the Prisma client
   */
  constructor(modelSelector: (prisma: PrismaClient) => M) {
    this.prisma = prismaConnection;
    // Cast the specific model to our generic delegate interface
    this.model = modelSelector(this.prisma) as unknown as PrismaModelDelegate<
      T,
      CreateInput,
      UpdateInput,
      WhereInput,
      WhereUniqueInput
    >;
  }

  /**
   * Inserts a new entity into the database.
   * @param data Entity creation data
   * @returns The created entity
   */
  async insert(data: CreateInput): Promise<T> {
    return this.model.create({ data });
  }

  /**
   * Inserts multiple entities into the database.
   * @param data Array of entity creation data
   * @param skipDuplicates Whether to skip duplicates
   * @returns Object with count of inserted records
   */
  async insertMany(data: CreateInput[], skipDuplicates = true): Promise<{ count: number }> {
    return this.model.createMany({ data, skipDuplicates });
  }

  /**
   * Upserts (inserts or updates) an entity.
   * @param where Unique identifier for the entity
   * @param update Data to update if entity exists
   * @param create Data to create if entity doesn't exist
   * @returns The upserted entity
   */
  async upsert(where: WhereUniqueInput, update: UpdateInput, create: CreateInput): Promise<T> {
    return this.model.upsert({
      where,
      update,
      create,
    });
  }

  /**
   * Finds all entities matching the query.
   * @param where Query filter
   * @param select Fields to select
   * @param include Related entities to include
   * @param orderBy Sorting options
   * @returns Array of entities
   */
  async findAll<R = T>(
    where?: WhereInput,
    select?: Record<string, boolean>,
    include?: Record<string, boolean>,
    orderBy?: Record<string, 'asc' | 'desc'>,
    skip?: number,
    take?: number,
  ): Promise<R[]> {
    return this.model.findMany<R>({
      where,
      ...(orderBy && { orderBy }),
      ...(select && { select }),
      ...(include && { include }),
      ...(skip && { skip }),
      ...(take && { take }),
    });
  }

  /**
   * Finds an entity by its unique identifier.
   * @param where Unique identifier
   * @param select Fields to select
   * @param include Related entities to include
   * @returns The entity or null if not found
   */
  async findUnique<R = T>(
    where: WhereUniqueInput,
    select?: Record<string, boolean>,
    include?: Record<string, boolean>,
  ): Promise<R | null> {
    return this.model.findUnique<R>({
      where,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  /**
   * Finds an entity by its ID.
   * @param id Entity ID
   * @param select Fields to select
   * @param include Related entities to include
   * @returns The entity or null if not found
   */
  async findById<R = T>(
    id: string,
    select?: Record<string, boolean>,
    include?: Record<string, boolean>,
  ): Promise<R | null> {
    return this.model.findUnique<R>({
      where: { id } as unknown as WhereUniqueInput,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  /**
   * Updates an entity matching the unique identifier.
   * @param where Unique identifier to match entity
   * @param data Data to update
   * @param select Fields to select
   * @param include Related entities to include
   * @returns The updated entity
   */
  async update(
    where: WhereUniqueInput,
    data: UpdateInput,
    select?: Record<string, boolean>,
    include?: Record<string, boolean>,
  ): Promise<T> {
    return this.model.update({
      where,
      data,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  /**
   * Updates multiple entities matching the query.
   * @param where Query to match entities
   * @param data Data to update
   * @returns Object with count of updated records
   */
  async updateMany(
    where: WhereInput,
    data: UpdateInput,
    limit?: number,
  ): Promise<{ count: number }> {
    return this.model.updateMany({ where, data, limit });
  }

  /**
   * Counts entities matching the query.
   * @param where Query filter
   * @returns Count of entities
   */
  async count(where?: WhereInput): Promise<number> {
    return this.model.count({ where });
  }

  /**
   * Deletes an entity by its unique identifier.
   * @param where Unique identifier
   * @returns The deleted entity
   */
  async deleteUnique(where: WhereUniqueInput): Promise<T> {
    return this.model.delete({ where });
  }

  /**
   * Deletes an entity by its ID.
   * @param id Entity ID
   * @returns The deleted entity
   */
  async delete(id: string | number): Promise<T> {
    return this.model.delete({ where: { id } as unknown as WhereUniqueInput });
  }

  /**
   * Retrieves paginated results for a query.
   * @param where Query filter
   * @param skip Number of records to skip
   * @param take Number of records to return
   * @param select Fields to select
   * @param include Related entities to include
   * @param orderBy Sorting options
   * @returns Array of entities
   */
  async getPaginatedResult<R = T>(
    where?: WhereInput,
    skip = 0,
    take = 10,
    select?: Record<string, boolean>,
    include?: Record<string, boolean>,
    orderBy?: Record<string, 'asc' | 'desc'>,
  ): Promise<R[]> {
    return this.model.findMany<R>({
      where,
      ...(orderBy && { orderBy }),
      skip,
      take,
      ...(select && { select }),
      ...(include && { include }),
    });
  }

  /**
   * Groups data by specified fields.
   * @param groupByQuery Group by query object
   * @returns Grouped data
   */
  async groupData(groupByQuery: {
    by: string[];
    _count?: boolean;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
  }): Promise<unknown> {
    if (!this.model.groupBy) {
      throw new Error('GroupBy operation not supported for this model');
    }
    return (await this.model.groupBy(groupByQuery)) ?? [];
  }

  /**
   * Performs aggregation queries.
   * @param query Aggregation query object
   * @returns Aggregated data
   */
  async aggregatedData(query: {
    _count?: boolean;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
  }): Promise<unknown> {
    if (!this.model.aggregate) {
      throw new Error('Aggregate operation not supported for this model');
    }
    const result = await this.model.aggregate(query);
    return result ?? null;
  }
}
