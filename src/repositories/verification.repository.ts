import { Prisma, PrismaClient, Verification } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class VerificationRepository extends BaseRepository<
  Verification,
  Prisma.VerificationCreateInput,
  Prisma.VerificationUpdateInput,
  Prisma.VerificationWhereInput,
  Prisma.VerificationWhereUniqueInput,
  PrismaClient['verification']
> {
  constructor() {
    super((prisma: PrismaClient) => prisma.verification);
  }

  async findValidVerification(
    userId: string,
    type: 'EMAIL_VERIFY' | 'PASSWORD_RESET',
  ): Promise<Verification | null> {
    return this.model.findFirst({
      where: {
        userId,
        type,
        expiresAt: { gt: new Date() },
      },
    });
  }
}
