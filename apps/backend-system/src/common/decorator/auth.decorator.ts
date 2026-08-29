import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Request } from 'express';

export interface JwtPayload {
  sub: bigint;
  role: string;
  /**
   * Toko tempat pengguna ini bertugas, dibawa langsung oleh token (lihat
   * `generateTokens`). Bernilai kosong untuk Owner dan Admin, yang secara
   * organisasi tidak terikat satu toko — merekalah yang harus memilih toko
   * sebelum bertransaksi di POS.
   *
   * Karena BigInt diserialisasi sebagai string saat token ditandatangani,
   * nilainya sampai di sini berupa string.
   */
  storeId?: string | null;
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
