import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from 'mail/mail.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './dto/dto.password-reset';

const CODE_TTL_MINUTES = 10;
/// Batas salah tebak sebelum kode dianggap hangus, supaya tidak bisa ditebak
const MAX_ATTEMPTS = 5;

@Injectable()
export class PasswordResetService {
  constructor(private readonly mailService: MailService) {}

  /// Kode diambil dari sumber acak kriptografis, bukan Math.random.
  private generateCode(): string {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;

    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
  }

  private findActiveCode(userId: bigint) {
    return prisma.passwordResetCode.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
        attempts: { lt: MAX_ATTEMPTS },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await prisma.users.findUnique({
      where: { email: dto.email },
      include: {
        employees: { select: { name: true } },
        customer: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Email tidak terdaftar');
    }
    if (!user.isActive) {
      throw new BadRequestException('Akun ini sedang tidak aktif');
    }

    const code = this.generateCode();

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetCode.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      await tx.passwordResetCode.create({
        data: {
          userId: user.id,
          codeHash: await bcrypt.hash(code, 10),
          expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
        },
      });
    });

    await this.mailService.sendPasswordResetCode({
      to: user.email,
      name: user.employees?.name ?? user.customer?.name ?? 'Pengguna',
      code,
      expiresInMinutes: CODE_TTL_MINUTES,
    });

    return {
      message: 'Kode verifikasi telah dikirim ke email Anda',
      maskedEmail: this.maskEmail(user.email),
      expiresInMinutes: CODE_TTL_MINUTES,
    };
  }

  private async assertValidCode(email: string, code: string) {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Email tidak terdaftar');

    const active = await this.findActiveCode(user.id);
    if (!active) {
      throw new BadRequestException(
        'Kode verifikasi tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.',
      );
    }

    const isMatch = await bcrypt.compare(code, active.codeHash);

    if (!isMatch) {
      const attempts = active.attempts + 1;
      await prisma.passwordResetCode.update({
        where: { id: active.id },
        data: { attempts },
      });

      const remaining = MAX_ATTEMPTS - attempts;
      throw new BadRequestException(
        remaining > 0
          ? `Kode verifikasi salah. Sisa percobaan: ${remaining}`
          : 'Kode verifikasi salah dan sudah melewati batas percobaan. Silakan minta kode baru.',
      );
    }

    return { user, resetCode: active };
  }

  /// Langkah 2: memastikan kode benar sebelum form kata sandi baru ditampilkan.
  async verifyResetCode(dto: VerifyResetCodeDto) {
    await this.assertValidCode(dto.email, dto.code);

    return { valid: true as const, message: 'Kode verifikasi benar' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { user, resetCode } = await this.assertValidCode(dto.email, dto.code);

    const hashed = await bcrypt.hash(dto.password, 10);

    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashed,
          refreshToken: null,
        },
      }),
      prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      message:
        'Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.',
    };
  }
}
