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
import { AdminLoginDto } from '../common/dto/dto.login';
import { Roles } from '../common/decorator/roles.decorator';
import { JwtAuthGuard } from '../common/guards/guard.jwt-auth';
import { RolesGuard } from '../common/guards/guard.roles';
import { UserRole, type Users } from '@repo/db';
import type { Response } from 'express';
import { AuthUser } from 'common/decorator/auth.decorator';

@Controller('auth/admin/')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    return this.service.refreshAdminToken(req, res);
  }

  @Post('login')
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.loginAdmin(dto.email, dto.password, res);
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get('me')
  async me(@Req() req) {
    return this.service.getAdminProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@AuthUser() user: any, @Res({ passthrough: true }) res: Response) {
    return this.service.logout(user.sub, res);
  }
}
