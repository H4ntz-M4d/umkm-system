import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { CustomerRegisterDto, LoginDto } from './dto/dto.login';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './dto/dto.password-reset';
import { Roles } from '../common/decorator/roles.decorator';
import { JwtAuthGuard } from '../common/guards/guard.jwt-auth';
import { RolesGuard } from '../common/guards/guard.roles';
import { UserRole } from '@repo/db';
import type { Request, Response } from 'express';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { Throttle } from '@nestjs/throttler';

/**
 * Batas untuk endpoint yang menebak-nebak rahasia: kata sandi dan kode reset.
 *
 * Lima percobaan per menit tidak akan terasa oleh orang yang salah ketik, tapi
 * membuat penebakan sistematis tidak ada gunanya.
 *
 * Sengaja TIDAK dipasang pada `management/ref` dan `c/ref`: penyegaran token
 * dijalankan otomatis oleh frontend saat 401, dan satu halaman yang memuat
 * banyak permintaan sekaligus bisa memicunya beruntun. Membatasi di situ
 * berarti mengeluarkan pengguna sah dari sesinya sendiri.
 */
const CREDENTIAL_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('api/auth/')
export class AuthController {
  constructor(
    private service: AuthService,
    private passwordResetService: PasswordResetService,
  ) {}

  @Post('management/ref')
  async refreshAdmin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.refreshAdminToken(req, res);
  }

  @Throttle(CREDENTIAL_THROTTLE)
  @Post('management/login')
  async loginAdmin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.loginAdminService(
      dto.email,
      dto.password,
      res,
    );
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get('management/me')
  async me(@AuthUser() user: JwtPayload) {
    return this.service.getAdminProfile(user.sub);
  }

  // =============================== Customer ====================================

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @AuthUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.logoutService(user.sub, user.role, res);
  }

  // =============================== Customer ====================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('me/c')
  getCustomerProfile(@AuthUser() user: JwtPayload) {
    return this.service.getCustomerProfile(user.sub);
  }

  @Throttle(CREDENTIAL_THROTTLE)
  @Post('customer/register')
  async registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.service.registerCustomerService(dto);
  }

  @Throttle(CREDENTIAL_THROTTLE)
  @Post('customer/login')
  async loginCustomer(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.loginCustomerService(dto, res);
    return result;
  }

  @Post('c/ref')
  async refreshCustomer(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.refreshCustomerToken(req, res);
  }

  // ====================== Lupa / Ganti Kata Sandi ==============================

  /// Selain menahan penebakan kode, batas di sini mencegah kotak masuk seseorang
  /// dibanjiri email reset oleh orang lain yang tahu alamatnya.
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto);
  }

  @Throttle(CREDENTIAL_THROTTLE)
  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(dto);
  }

  @Throttle(CREDENTIAL_THROTTLE)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
  }
}
