import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@repo/db';

/**
 * Kapan stok pesanan online dicatat KELUAR (inventory ledger OUT).
 *
 *  - `'COMPLETED'` (sekarang): saat Lunas stoknya dikunci — pindah dari
 *    `stock` ke `reserved_stock` supaya kasir tidak bisa menjualnya — lalu
 *    baru benar-benar keluar saat Selesai (barang diterima customer).
 *  - `'PAID'`: stok langsung keluar saat Lunas, tanpa tahap kunci.
 *
 * Owner mungkin mengubah keputusan ini, jadi semua titik yang bergantung
 * padanya membaca konstanta ini — cukup ganti di sini. Aman diganti kapan
 * saja: pesanan yang sedang terkunci tetap dilepas dengan benar karena
 * masing-masing fungsi di bawah membaca mode yang sama.
 * Catatan: mengganti ke 'PAID' saat masih ada pesanan Lunas yang terkunci
 * akan membiarkan `reserved_stock` mereka menggantung — selesaikan dulu
 * pesanan-pesanan itu sebelum mengganti.
 */
export const ORDER_STOCK_OUT_AT: 'PAID' | 'COMPLETED' = 'COMPLETED';

/**
 * Bentuk minimal pesanan yang dibutuhkan efek stok.
 *
 * `type` dan `idPm` diambil dari produk induk tiap item: yang pertama
 * menentukan apakah kuota pre-order ikut bergerak, yang kedua menunjuk baris
 * kuotanya. `productName` dipakai untuk pesan galat yang menyebut produknya,
 * bukan cuma ID.
 */
export type PaidOrder = {
  id: bigint;
  storeId: bigint;
  totalAmount: Prisma.Decimal;
  items: {
    productVariantId: bigint;
    productName: string;
    quantity: number;
    type: string;
    idPm: bigint;
  }[];
};

type OrderLine = PaidOrder['items'][number];

/// Satu varian bisa muncul di beberapa item (catatan custom berbeda), jadi
/// jumlahnya digabung dulu — kalau tidak, pengecekan "cukup" dilakukan per
/// item dan dua item yang masing-masing muat bisa lolos padahal totalnya tidak.
function groupByVariant(items: OrderLine[]) {
  const map = new Map<bigint, OrderLine>();
  for (const item of items) {
    const existing = map.get(item.productVariantId);
    if (existing) existing.quantity += item.quantity;
    else map.set(item.productVariantId, { ...item });
  }
  return [...map.values()];
}

function groupPreOrderQuota(items: OrderLine[]) {
  const map = new Map<bigint, { name: string; quantity: number }>();
  for (const item of items) {
    if (item.type !== 'PRE_ORDER') continue;
    const existing = map.get(item.idPm);
    if (existing) existing.quantity += item.quantity;
    else
      map.set(item.idPm, { name: item.productName, quantity: item.quantity });
  }
  return map;
}

function stockKey(order: PaidOrder, variantId: bigint) {
  return {
    productVariantId_storeId: {
      productVariantId: variantId,
      storeId: order.storeId,
    },
  };
}

async function writeLedger(
  order: PaidOrder,
  lines: OrderLine[],
  direction: 'IN' | 'OUT',
  tx: Prisma.TransactionClient,
) {
  await tx.inventoryLedger.createMany({
    data: lines.map((line) => ({
      itemType: 'PRODUCT_VARIANT' as const,
      itemId: line.productVariantId,
      source: 'ONLINE_ORDER' as const,
      referenceId: order.id,
      direction,
      quantity: line.quantity,
      storeId: order.storeId,
    })),
  });
}

/**
 * Lunas: stok barang pesanan diambil dari stok bebas toko, kuota pre-order
 * dikurangi.
 *
 * Berlaku sama untuk Reguler dan Pre-Order: pesanan baru boleh Lunas kalau
 * barangnya sudah ada di toko. Customer yang membayar penuh sebelum barangnya
 * jadi dicatat sebagai DP sebesar total, bukan Lunas.
 *
 * Semua kekurangan dikumpulkan lalu dilaporkan sekaligus, supaya admin tidak
 * menemukannya satu per satu lewat percobaan berulang.
 *
 * Pengurangannya memakai `updateMany` bersyarat (`stock >= qty`), bukan baca
 * lalu tulis: kasir bisa menjual barang yang sama di detik yang sama, dan
 * pemeriksaan terpisah akan lolos untuk keduanya.
 *
 * Pemanggil wajib memastikan ini hanya jalan sekali per pesanan (lewat
 * `stockLockedAt`).
 */
export async function lockOrderStock(
  order: PaidOrder,
  tx: Prisma.TransactionClient,
) {
  const lines = groupByVariant(order.items);
  const shortages: string[] = [];

  for (const line of lines) {
    const moved = await tx.productVariantStock.updateMany({
      where: {
        productVariantId: line.productVariantId,
        storeId: order.storeId,
        stock: { gte: line.quantity },
      },
      data: {
        stock: { decrement: line.quantity },
        ...(ORDER_STOCK_OUT_AT === 'COMPLETED' && {
          reserved_stock: { increment: line.quantity },
        }),
      },
    });

    if (moved.count === 0) {
      const row = await tx.productVariantStock.findUnique({
        where: stockKey(order, line.productVariantId),
        select: { stock: true },
      });
      shortages.push(
        `${line.productName} (butuh ${line.quantity}, stok ${row?.stock ?? 0})`,
      );
    }
  }

  if (shortages.length > 0) {
    throw new BadRequestException(
      `Stok di toko belum cukup untuk menandai pesanan ini Lunas: ${shortages.join(', ')}. Tambah stok lewat produksi atau kiriman dulu. Kalau customer sudah membayar penuh sebelum barangnya siap, catat sebagai DP sebesar total.`,
    );
  }

  for (const [idPm, quota] of groupPreOrderQuota(order.items)) {
    /**
     * Bersyarat juga, dengan alasan yang sama. Dua kemungkinan kegagalannya
     * masing-masing punya pesan sendiri: baris kuotanya hilang dari database,
     * atau kuotanya sudah habis diambil pesanan lain sejak pengajuan
     * (pengajuan hanya mengecek kuota saat itu, tidak mengunci).
     */
    const taken = await tx.productPreOrderDetails.updateMany({
      where: { productMasterId: idPm, maxQuota: { gte: quota.quantity } },
      data: {
        maxQuota: { decrement: quota.quantity },
        quotaTarget: { decrement: quota.quantity },
      },
    });

    if (taken.count === 0) {
      const current = await tx.productPreOrderDetails.findUnique({
        where: { productMasterId: idPm },
        select: { maxQuota: true },
      });

      throw new BadRequestException(
        current
          ? `Kuota pre-order ${quota.name} tersisa ${current.maxQuota}, tidak cukup untuk ${quota.quantity} pcs pada pesanan ini. Kemungkinan kuotanya sudah diambil pesanan lain yang lebih dulu lunas.`
          : `Kuota pre-order untuk ${quota.name} sudah tidak ada di database. Tidak bisa menandai pesanan ini lunas sebelum data kuotanya diperbaiki.`,
      );
    }
  }

  if (ORDER_STOCK_OUT_AT === 'PAID') {
    await writeLedger(order, lines, 'OUT', tx);
  }
}

/**
 * Melepas kunci `reserved_stock` tanpa mengembalikannya ke stok bebas.
 *
 * Ditolak kalau kuncinya kurang dari yang dilepas. Itu tidak mungkin terjadi
 * lewat alur normal — artinya `reserved_stock` sempat diubah di luar alur
 * pesanan — dan diam-diam membuatnya minus hanya menyembunyikan masalahnya.
 */
async function releaseReserved(
  order: PaidOrder,
  lines: OrderLine[],
  tx: Prisma.TransactionClient,
  restoreToStock: boolean,
) {
  const broken: string[] = [];

  for (const line of lines) {
    const released = await tx.productVariantStock.updateMany({
      where: {
        productVariantId: line.productVariantId,
        storeId: order.storeId,
        reserved_stock: { gte: line.quantity },
      },
      data: {
        reserved_stock: { decrement: line.quantity },
        ...(restoreToStock && { stock: { increment: line.quantity } }),
      },
    });

    if (released.count === 0) {
      const row = await tx.productVariantStock.findUnique({
        where: stockKey(order, line.productVariantId),
        select: { reserved_stock: true },
      });
      broken.push(
        `${line.productName} (terkunci ${row?.reserved_stock ?? 0}, pesanan ${line.quantity})`,
      );
    }
  }

  if (broken.length > 0) {
    throw new BadRequestException(
      `Stok terkunci untuk pesanan ini tidak sesuai catatan: ${broken.join(', ')}. Kemungkinan stok terkunci sempat diubah di luar alur pesanan. Periksa data stoknya sebelum melanjutkan.`,
    );
  }
}

/// Selesai (barang diterima): stok yang dikunci saat Lunas resmi keluar.
export async function completeOrderStock(
  order: PaidOrder,
  tx: Prisma.TransactionClient,
) {
  if (ORDER_STOCK_OUT_AT === 'PAID') return;

  const lines = groupByVariant(order.items);
  await releaseReserved(order, lines, tx, false);
  await writeLedger(order, lines, 'OUT', tx);
}

/**
 * Barang kembali ke toko dan layak dijual lagi — Batal setelah Lunas, atau
 * Refund dengan barang dikembalikan. Stok bebas bertambah (bisa dijual kasir,
 * termasuk barang pre-order) dan kuota pre-order dikembalikan.
 */
export async function returnOrderStock(
  order: PaidOrder,
  tx: Prisma.TransactionClient,
) {
  const lines = groupByVariant(order.items);

  if (ORDER_STOCK_OUT_AT === 'COMPLETED') {
    await releaseReserved(order, lines, tx, true);
  } else {
    for (const line of lines) {
      await tx.productVariantStock.update({
        where: stockKey(order, line.productVariantId),
        data: { stock: { increment: line.quantity } },
      });
    }
    await writeLedger(order, lines, 'IN', tx);
  }

  /// Tidak melempar kalau baris kuotanya sudah tidak ada: yang penting
  /// stoknya kembali, dan tidak ada kuota yang bisa dikembalikan.
  for (const [idPm, quota] of groupPreOrderQuota(order.items)) {
    await tx.productPreOrderDetails.updateMany({
      where: { productMasterId: idPm },
      data: {
        maxQuota: { increment: quota.quantity },
        quotaTarget: { increment: quota.quantity },
      },
    });
  }
}

/// Refund tanpa barang kembali: barangnya dianggap hilang, dicatat keluar.
export async function writeOffOrderStock(
  order: PaidOrder,
  tx: Prisma.TransactionClient,
) {
  await completeOrderStock(order, tx);
}

/// Total uang pesanan yang tercatat masuk, dikurangi yang sudah keluar.
export async function netOrderCash(
  orderId: bigint,
  tx: Prisma.TransactionClient,
) {
  const recorded = await tx.cashTransaction.findMany({
    where: { source: 'ORDER', referenceId: orderId },
    select: { type: true, amount: true },
  });

  return recorded.reduce(
    (total, row) =>
      row.type === 'IN' ? total.add(row.amount) : total.sub(row.amount),
    new Prisma.Decimal(0),
  );
}

/**
 * Mencatat uang yang dikembalikan ke customer sebagai kas keluar.
 *
 * Tidak boleh melebihi yang pernah masuk: kas pesanan ini tidak bisa minus.
 */
export async function recordOrderRefund(
  order: { id: bigint; storeId: bigint },
  amount: Prisma.Decimal,
  note: string,
  tx: Prisma.TransactionClient,
) {
  if (amount.isZero()) return;

  const paid = await netOrderCash(order.id, tx);
  if (amount.gt(paid)) {
    throw new BadRequestException(
      `Nominal pengembalian melebihi uang yang sudah dibayar customer (Rp ${paid.toNumber().toLocaleString('id-ID')}).`,
    );
  }

  await tx.cashTransaction.create({
    data: {
      type: 'OUT',
      source: 'ORDER',
      referenceId: order.id,
      amount,
      storeId: order.storeId,
      note,
    },
  });
}

/**
 * Menaikkan kas masuk pesanan sampai sebesar `target`.
 *
 * Pesanan nego dibayar bertahap, jadi yang dicatat adalah SELISIHnya terhadap
 * yang sudah pernah tercatat — bukan nilai penuh. Menghitung selisih, bukan
 * menandai "sudah pernah jalan", membuat fungsi ini benar untuk semua urutan
 * pemakaian tanpa perlu penanda tambahan:
 *
 *  - DP 100rb dari nol      → catat 100rb masuk
 *  - lunas, total 500rb     → catat 350rb lagi (sisanya), bukan 500rb
 *  - dipanggil ulang        → selisihnya 0, tidak menulis apa-apa
 *  - DP dikoreksi turun     → selisih negatif, ditulis sebagai kas keluar
 *
 * Baris kas dipisah per pembayaran (bukan satu baris yang di-update) supaya
 * laporan bulanan mencerminkan kapan uangnya benar-benar masuk.
 */
export async function syncOrderCashIn(
  order: { id: bigint; storeId: bigint },
  target: Prisma.Decimal,
  tx: Prisma.TransactionClient,
) {
  const netRecorded = await netOrderCash(order.id, tx);

  const delta = target.sub(netRecorded);
  if (delta.isZero()) return;

  const isRefundCorrection = delta.isNegative();

  await tx.cashTransaction.create({
    data: {
      type: isRefundCorrection ? 'OUT' : 'IN',
      source: 'ORDER',
      referenceId: order.id,
      amount: delta.abs(),
      storeId: order.storeId,
      note: isRefundCorrection ? 'Koreksi pencatatan pembayaran pesanan' : null,
    },
  });
}
