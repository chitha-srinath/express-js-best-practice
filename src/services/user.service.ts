import { CreateUserData, UpdateUserData } from '@/Dtos/user.dto';
import { UserRepository, SessionRepository } from '../repositories/user.repository';
import { User } from '@prisma/client';
import { NotFoundError } from '../Utilities/ErrorUtility';
import { AccountRepository } from '../repositories/account.repository';
import { hashPassword } from '@/Utilities/encrypt-hash';

/**
 * Service for user-related business logic.
 * Handles creation, retrieval, update, and deletion of users.
 * Provides a clean interface between controllers and repositories.
 */
export class UserService {
  private userRepository: UserRepository;
  private accountRepository: AccountRepository;
  private sessionRepository: SessionRepository;

  /**
   * Initializes the UserService and its UserRepository dependency.
   */
  constructor() {
    this.userRepository = new UserRepository();
    this.accountRepository = new AccountRepository();
    this.sessionRepository = new SessionRepository();
  }

  /**
   * Creates a new user with the provided data.
   * @param data Data for the new user including email, password, and other user details
   * @returns Promise resolving to the created User object
   */
  async createuser(data: CreateUserData): Promise<User> {
    return this.userRepository.insert(data);
  }

  /**
   * Retrieves all users from the database.
   * @returns Promise resolving to an array of User objects
   */
  async getAllusers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  /**
   * Retrieves a specific user by their ID.
   * @param id The unique identifier of the user
   * @returns Promise resolving to the User object or null if not found
   */
  async getuserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Updates an existing user with new data.
   * @param id The unique identifier of the user to update
   * @param data The new data to update the user with
   * @returns Promise resolving to the updated User object
   * @throws NotFoundError if the user with the given ID is not found
   */
  async updateuser(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.userRepository.update({ id }, data);
  }

  /**
   * Deletes a user by their ID.
   * @param id The unique identifier of the user to delete
   * @returns Promise resolving to the deleted User object
   * @throws NotFoundError if the user with the given ID is not found
   */
  async deleteuser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.userRepository.delete(id);
  }

  /**
   * Finds a user by Google info or creates a new one if not found. Links Google account if needed.
   * @param googleUserInfo Google user info object
   * @returns Promise resolving to the found or created User object
   */
  async findOrCreateGoogleUser(googleUserInfo: {
    email: string;
    id: string;
    name: string;
    picture?: string;
  }): Promise<User> {
    // Try to find user by email
    let user = await this.userRepository.findFirst({ email: googleUserInfo.email });

    if (!user) {
      // Create new user
      user = await this.userRepository.insert({
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        emailVerified: true,
        image: googleUserInfo.picture,
        createdAt: new Date(),
      });
      // Create Google account for new user
      await this.accountRepository.insert({
        id: googleUserInfo.id, // assuming Google ID is unique
        accountId: googleUserInfo.id,
        providerId: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { connect: { id: user.id } },
      });
      return user;
    }

    // User exists, check for existing Google account
    const googleAccount = await this.accountRepository.findFirst({
      userId: user.id,
      providerId: 'google',
    });
    if (googleAccount) {
      // User already has a Google account, return user
      return user;
    }
    // Check if user has any other account (non-Google)
    const otherAccount = await this.accountRepository.findFirst({ userId: user.id });
    if (otherAccount) {
      // User has another provider, throw error
      throw new Error('User is already signed up with another provider');
    }
    // No Google account, no other provider, create Google account
    await this.accountRepository.insert({
      id: googleUserInfo.id, // assuming Google ID is unique
      accountId: googleUserInfo.id,
      providerId: 'google',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { connect: { id: user.id } },
    });
    return user;
  }

  // src/services/user.service.ts
  async findOrCreateUserWithProvider({
    providerId,
    accountId,
    email,
    name,
    image,
    password,
    extraData = {},
  }: {
    providerId: string;
    accountId: string;
    email: string;
    name: string;
    image?: string;
    password?: string;
    extraData?: Record<string, unknown>;
  }): Promise<User> {
    let user = email ? await this.userRepository.findFirst({ email }) : null;

    if (!user) {
      user = await this.userRepository.insert({
        email,
        name,
        image,
        emailVerified: providerId !== 'credentials',
        createdAt: new Date(),
      });
    }

    // Check if account already exists
    const account = await this.accountRepository.findFirst({
      userId: user.id,
      providerId,
    });

    if (!account) {
      await this.accountRepository.createAccount({
        userId: user.id,
        providerId,
        accountId,
        password,
        extraData,
      });
    } else {
      if (account.providerId !== providerId) {
        throw new Error('User is already signed up with another provider');
      }
    }

    return user;
  }

  async changePassword(_userId: string, _oldPassword: string, _newPassword: string): Promise<void> {
    // const hashedPassword = await hashPassword(oldPassword);
    // Validate old password in db
    // const isValid = await this.userRepository.findAll({ userId, hashedPassword });
    // if (!isValid) {
    //   throw new UnauthorizedError('Invalid old password');
    // }
    // await this.updatePassword(userId, newPassword);
  }

  async updatePassword(userId: string, _newPassword: string): Promise<void> {
    {
      const _hashedPassword = await hashPassword(_newPassword);
      await this.accountRepository.update(
        {
          id: userId,
        },
        { password: _hashedPassword },
      );
    }
  }
}
