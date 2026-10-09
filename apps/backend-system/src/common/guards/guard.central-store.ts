import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { prisma } from '@repo/db';
import { CENTRAL_STORE_KEY } from 'common/decorator/central-store.decorator';
import type { JwtPayload } from 'common/decorator/auth.decorator';

/**
 * Membatasi endpoint bertanda `@CentralStoreOnly` ke orang pusat.
 *
 * Yang dianggap pusat: pengguna yang bertugas di toko berpenanda rumah
 * produksi, DAN pengguna yang tidak terikat toko mana pun — akun tanpa toko
 * memang tidak mewakili cabang, melainkan pengelola yang berdiri di atas
 * semua toko.
 *
 * Toko pusat dibaca dari database, bukan dari angka yang ditanam di kode,
 * supaya penandanya tetap satu sumber yang sama dengan produksi dan
 * distribusi stok.
 */
@Injectable()
export class CentralStoreGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      CENTRAL_STORE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) return true;

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    /// Tanpa toko = pengelola pusat. Inilah bentuk akun Owner/Admin yang
    /// tidak ditempatkan di cabang mana pun.
    if (!user?.storeId) return true;

    const central = await prisma.store.findFirst({
      where: { isActive: true, isProductionHouse: true },
      select: { id: true },
    });

    /// Penanda rumah produksi belum diatur: lebih baik menolak daripada
    /// diam-diam membuka data master untuk semua cabang.
    if (!central) {
      throw new ForbiddenException(
        'Toko pusat belum ditetapkan. Tandai salah satu toko sebagai rumah produksi terlebih dahulu.',
      );
    }

    if (String(central.id) !== String(user.storeId)) {
      throw new ForbiddenException(
        'Hanya pengelola toko pusat yang boleh mengubah data ini.',
      );
    }

    return true;
  }
}
