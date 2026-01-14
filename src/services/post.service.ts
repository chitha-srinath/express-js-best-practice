import { Post } from '@prisma/client';
import { PostRepository } from '../repositories/post.repository';
import { CreatePostData, UpdatePostData } from '@/Dtos/post.dto';
import { NotFoundError } from '../Utilities/ErrorUtility';
import { ErrorMessages } from '@/constants/error-messages.constatnts';

/**
 * Service for post-related business logic.
 * Handles creation, retrieval, update, and deletion of posts.
 * Provides a clean interface between controllers and repositories.
 */
export class PostService {
  private postRepository: PostRepository;

  /**
   * Initializes the PostService and its PostRepository dependency.
   */
  constructor() {
    this.postRepository = new PostRepository();
  }

  /**
   * Creates a new post with the provided data.
   * @param data Data for the new post including title, description, and user ID
   * @returns Promise resolving to the created Post object
   */
  async createpost(data: CreatePostData): Promise<Post> {
    const result = await this.postRepository.insert({
      title: data.title,
      description: data.description,
      user: {
        connect: {
          id: data.userId,
        },
      },
    });
    return result;
  }

  /**
   * Retrieves all posts from the database.
   * @returns Promise resolving to an array of Post objects
   */
  async getAllposts(): Promise<Post[]> {
    const result = await this.postRepository.findAll();
    return result;
  }

  /**
   * Retrieves a specific post by its ID.
   * @param id The unique identifier of the post
   * @returns Promise resolving to the Post object or null if not found
   */
  async getpostById(id: string): Promise<Post | null> {
    const result = await this.postRepository.findById(id);
    if (!result) {
      throw new NotFoundError(ErrorMessages.POST.POST_NOT_FOUND);
    }
    return result;
  }

  /**
   * Updates an existing post with new data.
   * @param id The unique identifier of the post to updat
   * @param data The new data to update the post with
   * @returns Promise resolving to the updated Post object
   */
  async updatepost(id: string, data: UpdatePostData): Promise<{ count: number }> {
    await this.getpostById(id);
    const post = await this.postRepository.updateMany({ id }, data);
    return post;
  }

  /**
   * Deletes a post by its ID.
   * @param id The unique identifier of the post to delete
   * @returns Promise resolving to the deleted Post object
   * @throws NotFoundError if the post with the given ID is not found
   */
  async deletepost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const result = await this.postRepository.delete(id);
    return result;
  }
}
