import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

export const AUTH_SCOPE_HEADER = 'x-auth-scope';

const ADMIN_COOKIE = 'access_token_admin';
const CUSTOMER_COOKIE = 'access_token_customer';

function isUsable(token?: string): boolean {
  if (!token) return false;

  try {
    // Isi token sengaja tidak dicatat: fungsi ini dijalankan pada setiap
    // permintaan yang membawa sesi, dan payload-nya memuat identitas pengguna.
    const payload = token.split('.')[1];
    if (!payload) return false;

    const { exp } = JSON.parse(
      Buffer.from(payload, 'base64url').toString(),
    ) as { exp?: number };

    return typeof exp === 'number' && Date.now() < exp * 1000;
  } catch {
    return false;
  }
}

/**
 * Satu browser bisa memegang sesi admin dan sesi customer sekaligus, jadi
 * keberadaan cookie saja tidak cukup untuk menentukan token mana yang dipakai.
 *
 * Urutan penentuannya:
 *  1. Bearer — dipakai Server Component yang sudah memilih tokennya sendiri.
 *  2. Header scope — request menyatakan sesi mana yang dimaksud. Sengaja
 *     eksklusif: kalau scope customer tapi tokennya kedaluwarsa, balas 401 agar
 *     client menyegarkan sesi customer, bukan diam-diam memakai token admin
 *     (yang ujungnya jadi 403 dan menyesatkan).
 *  3. Tanpa petunjuk — pakai token yang masih hidup, admin lebih dulu.
 */
function extractToken(req: Request): string | null {
  const bearer = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (bearer) return bearer;

  const admin = req?.cookies?.[ADMIN_COOKIE] as string | undefined;
  const customer = req?.cookies?.[CUSTOMER_COOKIE] as string | undefined;

  const scope = req?.headers?.[AUTH_SCOPE_HEADER];
  if (scope === 'customer') return customer ?? null;
  if (scope === 'admin') return admin ?? null;

  return [admin, customer].find(isUsable) ?? admin ?? customer ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractToken]),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return payload;
  }
}
