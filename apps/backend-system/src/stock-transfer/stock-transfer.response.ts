import { Prisma } from '@repo/db';

/**
 * Include yang dipakai seluruh jalur baca kiriman.
 *
 * Ditulis sekali dan dibagikan supaya bentuk data yang masuk ke mapper selalu
 * sama — kalau tiap query menyusun include-nya sendiri, satu saja yang lupa
 * menyertakan relasi akan membuat mapper diam-diam menghasilkan nama kosong.
 */
export const transferInclude = {
  fromStore: { select: { name: true } },
  toStore: { select: { name: true } },
  items: {
    include: {
      variant: {
        select: {
          sku: true,
          productMaster: { select: { name: true } },
          options: {
            select: { variantValue: { select: { value: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.StockTransferInclude;

type TransferEntity = Prisma.StockTransferGetPayload<{
  include: typeof transferInclude;
}>;

export function toStockTransferResponse(entity: TransferEntity) {
  return {
    id: String(entity.id),
    code: entity.code,
    status: entity.status,
    fromStoreId: String(entity.fromStoreId),
    fromStoreName: entity.fromStore.name,
    toStoreId: String(entity.toStoreId),
    toStoreName: entity.toStore.name,
    productionId: entity.productionId ? String(entity.productionId) : null,
    notes: entity.notes,
    createdAt: entity.createdAt.toISOString(),
    sentAt: entity.sentAt ? entity.sentAt.toISOString() : null,
    receivedAt: entity.receivedAt ? entity.receivedAt.toISOString() : null,
    totalQuantity: entity.items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
    items: entity.items.map((item) => ({
      productVariantId: String(item.productVariantId),
      productName: item.variant.productMaster.name,
      /// Nama varian dirangkai dari opsinya, sama seperti di laporan stok
      /// rendah — SKU saja sulit dikenali orang gudang.
      variantLabel: item.variant.options
        .map((option) => option.variantValue.value)
        .join(' / '),
      sku: item.variant.sku,
      quantity: item.quantity,
    })),
  };
}
