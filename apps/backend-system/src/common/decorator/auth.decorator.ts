import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';

export interface JwtPayload {
  sub: bigint;
  username: string;
  role: string;
}

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as JwtPayload;
    if (user) {
      return user;
    } else {
      throw new HttpException('Unauthorized', 401);
    }
  },
);
