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
    materials: {
      include: {
        rawMaterial: {
          select: {
            name: true;
            unit: true;
          };
        };
      };
    };
  };
}>;

export function toProductionResponse(entity: ProductionEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    producedVariantId: entity.producedVariantId,
    sku: entity.variant.sku,
    productName: entity.variant.productMaster.name,
    quantityProduced: entity.quantityProduced,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    materials: entity.materials.map((material) => ({
      id: material.id,
      productionId: material.productionId,
      rawMaterialId: material.rawMaterialId,
      quantityUsed: material.quantityUsed,
      nameRawMaterial: material.rawMaterial.name,
      unitRawMaterial: material.rawMaterial.unit,
    })),
  };
}

type ProductionOnlyEntity = Prisma.ProductionGetPayload<{
  select: {
    id: true;
    storeId: true;
    producedVariantId: true;
    quantityProduced: true;
    status: true;
    createdAt: true;
  };
}>;

export function toProductionOnlyResponse(entity: ProductionOnlyEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    producedVariantId: entity.producedVariantId,
    quantityProduced: entity.quantityProduced,
    status: entity.status,
    createdAt: entity.createdAt,
  };
}

type ProductionMaterialEntity = Prisma.ProductionMaterialGetPayload<{
  select: {
    id: true;
    productionId: true;
    rawMaterialId: true;
    quantityUsed: true;
  };
}>;

export function toProductionMaterialOnlyResponse(
  entity: ProductionMaterialEntity,
) {
  return {
    id: entity.id,
    productionId: entity.productionId,
    rawMaterialId: entity.rawMaterialId,
    quantityUsed: entity.quantityUsed,
  };
}
