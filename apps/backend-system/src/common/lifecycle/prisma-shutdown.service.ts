import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { prisma } from '@repo/db';

/**
 * Menutup pool koneksi Prisma saat aplikasi diberhentikan.
 *
 * Prisma di proyek ini bukan provider Nest melainkan singleton modul di
 * `@repo/db`, jadi `enableShutdownHooks()` saja tidak punya apa pun untuk
 * dipanggil. Jembatan kecil ini yang menghubungkan keduanya.
 *
 * Kenapa penting: tiap redeploy tanpa `$disconnect()` meninggalkan koneksi
 * menggantung di Postgres sampai server sendiri yang membersihkannya. Postgres
 * punya batas koneksi (default 100), dan sepuluh kali deploy dalam sehari saat
 * sedang memperbaiki bug cukup untuk menabraknya. Gejalanya —
 * `too many clients already` — muncul jauh dari penyebabnya, jadi sulit
 * dilacak kalau tidak ditutup sejak awal.
 */
@Injectable()
export class PrismaShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(PrismaShutdownService.name);

  async onApplicationShutdown(signal?: string) {
    this.logger.log(
      `Menutup koneksi database (sinyal: ${signal ?? 'tidak diketahui'})`,
    );
    await prisma.$disconnect();
  }
}
