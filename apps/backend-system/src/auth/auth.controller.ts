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
import { UserRole, type Users } from '@repo/db';
import type { Response } from 'express';
import { AuthUser } from 'common/decorator/auth.decorator';

@Controller('auth/')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('management/refresh')
  async refreshAdmin(@Req() req, @Res({ passthrough: true }) res: Response) {
    return this.service.refreshAdminToken(req, res);
  }

  @Post('management/login')
  async loginAdmin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.loginAdminService(dto.email, dto.password, res);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get('management/me')
  async me(@Req() req) {
    return this.service.getAdminProfile(req.user.sub);
  }

  
  // =============================== Customer ====================================
  
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @AuthUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.logoutService(user.sub, user.role, res);
  }

  // =============================== Customer ====================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('me/c')
  getCustomerProfile(@Req() req) {
    return this.service.getCustomerProfile(req.user.sub);
  }

  @Post('customer/register')
  async registerCustomer (
    @Body() dto: CustomerRegisterDto
  ) {
    return this.service.registerCustomerService(dto)
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
  async refreshCustomer(@Req() req, @Res({ passthrough: true }) res: Response) {
    return this.service.refreshCustomerToken(req, res);
  }

}
