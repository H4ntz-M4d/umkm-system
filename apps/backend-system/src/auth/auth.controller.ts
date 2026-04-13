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
import { CustomerRegisterDto, LoginDto } from './dto/dto.login';
import { Roles } from '../common/decorator/roles.decorator';
import { JwtAuthGuard } from '../common/guards/guard.jwt-auth';
import { RolesGuard } from '../common/guards/guard.roles';
import { UserRole } from '@repo/db';
import type { Request, Response } from 'express';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';

@Controller('auth/')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('management/ref')
  async refreshAdmin(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.refreshAdminToken(req, res);
  }

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

  @Post('customer/register')
  async registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.service.registerCustomerService(dto);
  }

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
}
