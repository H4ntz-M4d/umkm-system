import { BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/db';
import type { JwtPayload } from 'common/decorator/auth.decorator';

/**
 * Menentukan toko tempat seorang pengguna bertransaksi di POS.
 *
 * Kasir terkunci ke tokonya sendiri lewat token — apa pun yang dikirim di body
 * atau query diabaikan. Owner dan Admin tidak terikat toko, jadi merekalah
 * satu-satunya yang boleh menyebutkan toko, dan pilihannya divalidasi ke toko
 * yang benar-benar ada dan aktif supaya tidak ada transaksi menggantung di toko
 * fiktif.
 *
 * Ditaruh di `common` dan bukan di salah satu service, karena dipakai dua modul
 * yang tidak saling bergantung: menyimpan transaksi POS dan menyusun daftar
 * produk untuk layar kasir. Keduanya harus memakai jawaban yang sama, kalau
 * tidak kasir bisa melihat barang dari satu toko tapi menjualnya atas nama toko
 * lain.
 */
export async function resolveTransactionStore(
  user: JwtPayload,
  requestedStoreId?: string,
): Promise<bigint> {
  if (user.storeId) return BigInt(user.storeId);

  if (!requestedStoreId) {
    throw new BadRequestException(
      'Pilih toko terlebih dahulu sebelum melakukan transaksi.',
    );
  }

  const store = await prisma.store.findFirst({
    where: { id: BigInt(requestedStoreId), isActive: true },
    select: { id: true },
  });

  if (!store) {
    throw new BadRequestException('Toko tidak ditemukan atau tidak aktif.');
  }

  return store.id;
}
