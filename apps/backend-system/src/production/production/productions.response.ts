import { Prisma } from '@repo/db';

/// Label varian dari nilai opsinya ("Merah - M"), pola yang sama dengan
/// daftar item pesanan.
function variantLabel(options: { variantValue: { value: string } }[]) {
  return options.map((option) => option.variantValue.value).join(' - ');
}

const itemInclude = {
  variant: {
    select: {
      sku: true,
      productMaster: { select: { name: true } },
      options: { select: { variantValue: { select: { value: true } } } },
    },
  },
} satisfies Prisma.ProductionItemInclude;

export const productionListInclude = {
  parent: { select: { code: true } },
  items: { include: itemInclude },
} satisfies Prisma.ProductionInclude;

export const productionDetailInclude = {
  parent: { select: { code: true } },
  items: { include: itemInclude, orderBy: { id: 'asc' } },
  deliveries: {
    orderBy: { deliveredAt: 'desc' },
    include: {
      user: { select: { employees: { select: { name: true } } } },
      items: { include: { item: { include: itemInclude } } },
    },
  },
} satisfies Prisma.ProductionInclude;

type ProductionListEntity = Prisma.ProductionGetPayload<{
  include: typeof productionListInclude;
}>;

type ProductionDetailEntity = Prisma.ProductionGetPayload<{
  include: typeof productionDetailInclude;
}>;

/**
 * Bentuk ringkas untuk papan produksi.
 *
 * Kemajuan dijumlahkan di sini, bukan dikirim mentah per varian: daftar batch
 * hanya perlu menjawab "sudah berapa dari berapa".
 */
export function toProductionResponse(entity: ProductionListEntity) {
  return {
    id: entity.id,
    code: entity.code,
    status: entity.status,
    targetDate: entity.targetDate,
    notes: entity.notes,
    createdAt: entity.createdAt,
    completedAt: entity.completedAt,
    parentCode: entity.parent?.code ?? null,
    variantCount: entity.items.length,
    totalTarget: entity.items.reduce(
      (total, item) => total + item.targetQuantity,
      0,
    ),
    totalDelivered: entity.items.reduce(
      (total, item) => total + item.deliveredQuantity,
      0,
    ),
  };
}

export function toProductionDetailResponse(entity: ProductionDetailEntity) {
  return {
    ...toProductionResponse(entity),
    items: entity.items.map((item) => ({
      id: item.id,
      productVariantId: item.productVariantId,
      productName: item.variant.productMaster.name,
      sku: item.variant.sku,
      variantLabel: variantLabel(item.variant.options),
      targetQuantity: item.targetQuantity,
      deliveredQuantity: item.deliveredQuantity,
    })),
    deliveries: entity.deliveries.map((delivery) => ({
      id: delivery.id,
      deliveredAt: delivery.deliveredAt,
      note: delivery.note,
      recordedByName: delivery.user?.employees?.name ?? null,
      items: delivery.items.map((row) => ({
        productionItemId: row.productionItemId,
        productName: row.item.variant.productMaster.name,
        sku: row.item.variant.sku,
        quantity: row.quantity,
      })),
    })),
  };
}
