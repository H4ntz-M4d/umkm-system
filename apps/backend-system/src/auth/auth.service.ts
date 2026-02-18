import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma, UserRole, Users } from '@repo/db';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      role: user.role,
      branchId: user.branchId,
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

  async loginAdmin(email: string, password: string, res: Response) {
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

    res.cookie('refresh_token', token.refreshToken, {
      httpOnly: true,
      secure: false, // jika production berikan true
      sameSite: 'lax', //jika production berikan strict
      maxAge: 7 * 60 * 60 * 1000,
    });

    return {
      accessToken: token.accessToken,
    };
  }

  async getAdminProfile(userId: bigint) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        storeId: true,
        isActive: true,
      },
    });

    return user;
  }

  async refreshAdminToken(req: Request, res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const payload = this.jwtService.verify(refreshToken);

    const user = await prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access denied');

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user);

    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefresh },
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: false, // jika production berikan true
      sameSite: 'lax', //jika production berikan strict
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: tokens.accessToken,
    };
  }

  async logout(userId: bigint, res: Response) {
    await prisma.users.update({
        where: {
            id: userId
        },
        data: {
            refreshToken: null
        }
    })
    res.clearCookie("refresh_token")

    return {message: "Logged Out"}
  }
}
