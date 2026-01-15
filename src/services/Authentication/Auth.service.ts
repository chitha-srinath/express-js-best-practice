import { LoginPostDto, RegisterPostDto } from '../../Dtos/auth.dto';
import { hashPassword, verifyPassword, generateJwtToken } from '../../Utilities/encrypt-hash';
import { UnauthorizedError, BadRequestError } from '../../Utilities/ErrorUtility';
import { randomUUID, randomInt } from 'node:crypto';
import { UserRepository } from '../../repositories/user.repository';
import { AccountRepository } from '../../repositories/account.repository';
import { SessionRepository } from '../../repositories/session.repository';
import { VerificationRepository } from '../../repositories/verification.repository';
import { EmailService } from '../email.service';
import { VerificationType } from '@prisma/client';

/**
 * Service for authentication logic such as sign in, sign up, and access token retrieval.
 */
export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly accountRepository: AccountRepository;
  private readonly sessionRepository: SessionRepository;
  private readonly verificationRepository: VerificationRepository;
  private readonly emailService: EmailService;

  constructor() {
    this.userRepository = new UserRepository();
    this.accountRepository = new AccountRepository();
    this.sessionRepository = new SessionRepository();
    this.verificationRepository = new VerificationRepository();
    this.emailService = new EmailService();
  }

  /**
   * Authenticates a user and returns login data.
   * @param data Login credentials
   * @returns AuthResponse containing user info and tokens
   */
  async signIn(data: LoginPostDto): Promise<{ accessToken: string; refreshToken: string }> {
    // Find user by email with accounts
    const user = await this.userRepository.findByEmailWithAccounts(data.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user has password account
    const passwordAccount = user.accounts[0];
    if (!passwordAccount?.password) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, passwordAccount.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedError('Email not verified');
    }

    // Generate tokens
    const sessionId = randomUUID();
    const accessToken = generateJwtToken(
      {
        userId: user.id,
        email: user.email,
        sessionId: sessionId,
      },
      { expiresIn: '15m' },
    );

    const refreshToken = generateJwtToken(
      {
        sessionId: sessionId,
        userId: user.id,
      },
      { expiresIn: '7d' },
    );

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.sessionRepository.createSession(sessionId, user.id, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Registers a new user and returns registration data.
   * @param data Registration details
   * @returns AuthResponse containing new user info and tokens
   */
  async signUp(data: RegisterPostDto): Promise<string> {
    // Check if user already exists
    const existingUser = await this.userRepository.findFirst({ email: data.email });

    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await this.userRepository.createUser({
      name: data.email.split('@')[0],
      email: data.email,
      isActive: true,
      emailVerified: false,
    });

    // Create password account
    await this.accountRepository.createPasswordAccount(user.id, hashedPassword);

    return 'user sign up sucessfully';
  }

  /**
   * Retrieves a new access token using a refresh token.
   * @param token Refresh token string
   * @returns New access token string
   */
  async fetchAcessToken(token: string): Promise<string> {
    // Find session by refresh token
    const session = await this.sessionRepository.findByTokenWithUser(token);

    if (!session) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      // Delete expired session
      await this.sessionRepository.deleteUnique({ id: session.id });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Generate new access token
    const accessToken = generateJwtToken(
      {
        userId: session.user.id,
        email: session.user.email,
        sessionId: session.id,
      },
      { expiresIn: '15m' },
    );

    return accessToken;
  }

  /**
   * Logs out a user by invalidating their session.
   * @param sessionId Session ID to invalidate
   */
  async logout(sessionId: string): Promise<void> {
    await this.sessionRepository.deleteUnique({ id: sessionId });
  }

  async sendPasswordResetEmail(_email: string): Promise<void> {
    // step 1: find userid with email
    // const user = await this.userRepository.findByEmail(email);
    // if (!user) {
    //   throw new NotFoundError('User not found');
    // }
    // step 2: if already token is present
    // const existingToken = await this.userRepository.findPasswordResetToken({ userId: user.id });
    // if (existingToken) {
    //   // If a token exists, we delete it
    //   await this.userRepository.invalidatePasswordResetToken(existingToken);
    // }
    // step 3: Generate password reset token
    // const token = randomUUID();
    // step 4: Save token in database
    // await this.userRepository.savePasswordResetToken(email, token);
    // step 5: Send email
    // await this.emailService.sendPasswordResetEmail(email, token);
  }

  async resetPassword(_token: string, _newPassword: string): Promise<void> {
    // step 1: find the reset token in db
    // const resetTokenDetails = await this.userRepository.validatePasswordResetToken(token);
    // if (!resetTokenDetails) {
    //   throw new UnauthorizedError('Invalid or expired password reset token');
    // }
    // Hash new password
    // const hashedPassword = await hashPassword(newPassword);
    // Update user password
    // await this.userRepository.updatePassword(email, hashedPassword);
  }

  async verifyPasswordResetToken(_token: string): Promise<void> {
    // step 1: find reset token in db
    // const email = await this.userRepository.validatePasswordResetToken(token);
    // if (!email) {
    //   throw new UnauthorizedError('Invalid or expired password reset token');
    // }
  }

  async verifyAccessToken(_token: string): Promise<void> {
    // step 1: find session by access token
    // const session = await this.sessionRepository.findByToken(token);
    // if (!session) {
    //   throw new UnauthorizedError('Invalid or expired access token');
    // }
  }

  async sendEmailVerification(email: string): Promise<void> {
    const user = await this.userRepository.findFirst({ email });
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Ideally we might want to delete them or just let them expire.
    // For cleaner strictness, let's delete previous ones or just add new one.
    // Let's just create a new one.

    const otp = this.generateOTP();

    // The requirement says "verifyEmail" endpoint takes "code".
    // And "The backend should identify the user based on the HTTP-only cookie".
    // So we verify: match (userId, type=EMAIL_VERIFY, value=otp).

    await this.verificationRepository.insert({
      identifier: email,
      value: otp,
      type: VerificationType.EMAIL_VERIFY,
      user: { connect: { id: user.id } },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    await this.emailService.sendEmailVerification(user.name, email, otp);
  }

  async verifyEmail(
    email: string,
    otp: string,
  ): Promise<{ user: { id: string; email: string; username: string; isEmailVerified: boolean } }> {
    const user = await this.userRepository.findFirst({ email });
    if (!user) {
      throw new BadRequestError('Register email for verification');
    }

    if (user.emailVerified) {
      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.name,
          isEmailVerified: true,
        },
      };
    }

    const verification = await this.verificationRepository.findValidVerification(
      user.id,
      VerificationType.EMAIL_VERIFY,
    );

    if (!verification || verification.value !== otp) {
      throw new BadRequestError('Invalid or expired code');
    }

    const updatedUser = await this.userRepository.update({ id: user.id }, { emailVerified: true });

    // Cleanup verification
    await this.verificationRepository.deleteUnique({ id: verification.id });

    return {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.name,
        isEmailVerified: updatedUser.emailVerified || false,
      },
    };
  }

  // Generate secure 6-digit OTP
  generateOTP(): string {
    const otp = randomInt(100000, 1000000); // ensures always 6 digits
    return otp.toString();
  }
}
