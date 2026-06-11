import { Prisma } from '@repo/db';

type ProductionEntity = Prisma.ProductionGetPayload<{
  include: {
    variant: {
      select: {
        sku: true;
        productMaster: {
          select: {
            name: true;
          };
        };
      };
    };
    beSpokeDetails: {
      include: {
        customer: true;
      };
    };
  };
}>;

export function toProductionResponse(entity: ProductionEntity) {
  let productName;
  if (entity.variant) {
    productName = `${entity.variant?.productMaster.name}`;
  } else {
    productName = entity.beSpokeDetails?.title;
  }

  return {
    id: entity.id,
    storeId: entity.storeId,
    producedVariantId: entity.producedVariantId,
    productName: productName,
    sku: entity.variant?.sku ?? '-',
    quantityProduced: entity.quantityProduced,
    type: entity.type,
    status: entity.status,
    targetDate: entity.targetDate,
    notes: entity.notes,
    createdAt: entity.createdAt.toISOString(),
    bespoke: {
      id: entity.beSpokeDetails?.id,
      title: entity.beSpokeDetails?.title,
      description: entity.beSpokeDetails?.description,
      quotedPrice: entity.beSpokeDetails?.quotedPrice,
      customer: {
        id: entity.beSpokeDetails?.customer?.id,
        name: entity.beSpokeDetails?.customer?.name,
        email: entity.beSpokeDetails?.customer?.email,
        phone: entity.beSpokeDetails?.customer?.phone,
      },
    },
  };
}

type ProductionOnlyEntity = Prisma.ProductionGetPayload<{
  select: {
    id: true;
    storeId: true;
    producedVariantId: true;
    quantityProduced: true;
    type: true;
    status: true;
    targetDate: true;
    notes: true;
    createdAt: true;
  };
}>;

export function toProductionOnlyResponse(entity: ProductionOnlyEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    producedVariantId: entity.producedVariantId,
    quantityProduced: entity.quantityProduced,
    type: entity.type,
    status: entity.status,
    targetDate: entity.targetDate,
    notes: entity.notes,
    createdAt: entity.createdAt,
  };
}
