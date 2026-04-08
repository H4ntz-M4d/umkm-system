import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma, UserRole, Users } from '@repo/db';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { CustomerRegisterDto, LoginDto } from './dto/dto.login';
import {
  toCustomerProfileResponse,
  toEmployeeProfileResponse,
} from 'auth/auth.response';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  private async generateTokens(user: Users) {
    const payload = {
      sub: user.id,
      role: user.role,
      storeId: user.storeId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async validateRefreshToken(req: Request, cookieName: string) {
    const refreshToken = req.cookies[cookieName] as string;

    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    try {
      const payload =
        this.jwtService.verify<Record<string, bigint>>(refreshToken);

      const user = await prisma.users.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken)
        throw new UnauthorizedException('Access denied');

      return {
        refreshToken,
        user,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async loginAdminService(email: string, password: string, res: Response) {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === UserRole.CUSTOMER) {
      throw new UnauthorizedException('Forbidden access');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User Inactive');
    }

    const token = await this.generateTokens(user);

    const hashedRefreshToken = await bcrypt.hash(token.refreshToken, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefreshToken,
      },
    });

    res.cookie('access_token_admin', token.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.cookie('refresh_token_admin', token.refreshToken, {
      httpOnly: true,
      secure: false, // jika production berikan true
      sameSite: 'lax', //jika production berikan strict
      maxAge: 7 * 60 * 60 * 1000,
    });

    return {
      message: 'Login Success, selamat datang',
    };
  }

  async getAdminProfile(userId: bigint) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        storeId: true,
        isActive: true,
        employees: {
          select: {
            name: true,
          },
        },
      },
    });

    return toEmployeeProfileResponse(user!);
  }

  async refreshAdminToken(req: Request, res: Response) {
    const { refreshToken, user } = await this.validateRefreshToken(
      req,
      'refresh_token_admin',
    );

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken!);

    if (!isMatch) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    res.cookie('access_token_admin', tokens.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.cookie('refresh_token_admin', tokens.refreshToken, {
      httpOnly: true,
      secure: false, // jika production berikan true
      sameSite: 'lax', //jika production berikan strict
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Success',
      accessToken: tokens.accessToken,
    };
  }

  // ================================ Admin ⬆️ ====================================

  async logoutService(userId: bigint, role: string, res: Response) {
    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        refreshToken: null,
      },
    });

    console.log(role);

    if (role === UserRole.CUSTOMER) {
      res.clearCookie('refresh_token_customer');
    } else {
      res.clearCookie('refresh_token_admin');
    }

    return { message: 'Logged Out' };
  }

  // ================================ Customer ⬇️ ====================================

  async registerCustomerService(data: CustomerRegisterDto) {
    const existing = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.users.create({
      data: {
        email: data.email,
        password: hashed,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        userId: user.id,
      },
    });

    return customer;
  }

  async loginCustomerService(data: LoginDto, res: Response) {
    const user = await prisma.users.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user || user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid Credentials');
    }

    const token = await this.generateTokens(user);
    const hashedRefresh = await bcrypt.hash(token.refreshToken, 10);

    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: hashedRefresh,
      },
    });

    res.cookie('access_token_customer', token.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.cookie('refresh_token_customer', token.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return {
      message: 'Login Success, selamat datang',
    };
  }

  async refreshCustomerToken(req: Request, res: Response) {
    const { refreshToken, user } = await this.validateRefreshToken(
      req,
      'refresh_token_customer',
    );

    if (user.role !== UserRole.CUSTOMER) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken!);

    if (!isMatch) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    res.cookie('access_token_customer', tokens.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.cookie('refresh_token_customer', tokens.refreshToken, {
      httpOnly: true,
      secure: false, // jika production berikan true
      sameSite: 'lax', //jika production berikan strict
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Success',
    };
  }

  async getCustomerProfile(userId: bigint) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    return toCustomerProfileResponse(user!);
  }
}
