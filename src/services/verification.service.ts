import { randomInt } from 'node:crypto';
import { VerificationType } from '@prisma/client';
import { VerificationRepository } from '../repositories/verification.repository';
import { EmailService } from './email.service';
import { UserRepository } from '../repositories/user.repository';

export class VerificationService {
  private readonly verificationRepository: VerificationRepository;
  private readonly emailService: EmailService;
  private readonly userRepository: UserRepository;

  constructor() {
    this.verificationRepository = new VerificationRepository();
    this.emailService = new EmailService();
    this.userRepository = new UserRepository();
  }

  async handleEmailVerification(email: string, name: string, userId: string): Promise<void> {
    const user = await this.userRepository.findFirst({ email, id: userId });
    if (!user) {
      console.error(`[VerificationService] User not found for email ${email}`);
      return;
    }

    if (user.emailVerified) {
      console.warn(`[VerificationService] User ${email} already verified. Skipping.`);
      return;
    }

    const existingVerifications = await this.verificationRepository.findAll({
      userId: user.id,
      type: VerificationType.EMAIL_VERIFY,
    });

    if (existingVerifications.length) {
      console.warn(`[VerificationService] Verification already exists for ${email}. Skipping.`);
      return;
    }

    const otp = this.generateOTP();

    await this.verificationRepository.insert({
      identifier: email,
      value: otp,
      type: VerificationType.EMAIL_VERIFY,
      user: { connect: { id: user.id } },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    await this.emailService.sendEmailVerification(name, email, otp);
  }

  private generateOTP(): string {
    const otp = randomInt(100000, 1000000); // ensures always 6 digits
    return otp.toString();
  }
}
