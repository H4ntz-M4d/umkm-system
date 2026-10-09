import { Prisma } from '@repo/db';

type BespokeEntity = Prisma.BespokeOrderGetPayload<{
  include: {
    customer: { select: { name: true; email: true; phone: true } };
    productMaster: { select: { name: true } };
  };
}>;

/// Data pembeli diratakan jadi tiga kolom, bukan objek bersarang: daftar
/// pesanan custom hanya perlu menampilkan dan menghubungi orangnya.
export function toBespokeOrderResponse(entity: BespokeEntity) {
  return {
    id: entity.id,
    code: entity.code,
    title: entity.title,
    description: entity.description,
    /// Kosong berarti desainnya di luar katalog — dan itulah yang membuat
    /// pesanan ini terkena jumlah minimum.
    productMasterId: entity.productMasterId
      ? String(entity.productMasterId)
      : null,
    productMasterName: entity.productMaster?.name ?? null,
    quantity: entity.quantity,
    quotedPrice: entity.quotedPrice,
    status: entity.status,
    targetDate: entity.targetDate,
    notes: entity.notes,
    completedAt: entity.completedAt,
    createdAt: entity.createdAt,
    customerName: entity.customer?.name ?? null,
    customerEmail: entity.customer?.email ?? null,
    customerPhone: entity.customer?.phone ?? null,
  };
}
