import { BadRequestException } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';

/**
 * Toko yang stoknya dijual di storefront.
 *
 * Sebelumnya jalur online memakai "toko aktif yang paling awal dibuat"
 * (`findFirst` diurutkan id) — aturan yang kebetulan benar karena toko utama
 * memang dibuat pertama, bukan karena diputuskan begitu. Akibatnya, menonaktifkan
 * toko utama sebentar atau menyemai ulang database dengan urutan berbeda akan
 * memindahkan pesanan online ke toko lain tanpa ada yang menyadarinya.
 *
 * Sekarang penentuannya eksplisit lewat `Store.isOnlineSource`, yang dibatasi
 * tepat satu baris oleh partial unique index — jadi `findFirst` di sini tidak
 * pernah ambigu.
 */
export async function findOnlineSourceStore(
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const store = await client.store.findFirst({
    where: { isActive: true, isOnlineSource: true },
    select: { id: true, name: true },
  });

  if (!store) {
    throw new BadRequestException(
      'Belum ada toko yang ditetapkan sebagai sumber penjualan online. Hubungi admin.',
    );
  }

  return store;
}

/**
 * Rumah produksi — tempat hasil produksi mendarat dan titik sebar distribusi.
 *
 * Dipisah dari `findOnlineSourceStore` meski hari ini menunjuk toko yang sama:
 * yang satu menjawab "stok mana yang dijual online", yang ini menjawab "ke mana
 * barang jadi masuk". Menggabungkannya berarti mengunci asumsi bahwa toko yang
 * berjualan online selalu juga yang memproduksi — dan itu kebetulan hari ini,
 * bukan sifat yang boleh diandalkan.
 *
 * Dibatasi tepat satu baris oleh partial unique index, jadi `findFirst` di sini
 * tidak pernah ambigu.
 */
export async function findProductionHouse(
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  const store = await client.store.findFirst({
    where: { isActive: true, isProductionHouse: true },
    select: { id: true, name: true },
  });

  if (!store) {
    throw new BadRequestException(
      'Belum ada toko yang ditetapkan sebagai rumah produksi. Hubungi admin.',
    );
  }

  return store;
}

/// Dipakai di `select` Prisma untuk menyaring stok hanya dari toko sumber
/// online. Ditulis sekali di sini supaya aturan yang sama tidak diketik ulang
/// di tiap kueri katalog dan keranjang.
export const onlineStockSelect = {
  where: { store: { isOnlineSource: true } },
  select: { stock: true },
} as const;
