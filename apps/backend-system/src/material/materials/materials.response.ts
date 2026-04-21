import { Prisma } from '@repo/db';

type MaterialsEntity = Prisma.RawMaterialGetPayload<{
  select: {
    id: true;
    name: true;
    unit: true;
    cost: true;
    isActive: true;
    rawMaterialStocks: {
      select: {
        stock: true;
      };
    };
  };
}>;

export function toMaterialsResponse(entity: MaterialsEntity) {
  return {
    id: entity.id,
    name: entity.name,
    unit: entity.unit,
    cost: entity.cost ?? 0,
    stock: entity.rawMaterialStocks?.stock ?? 0,
    isActive: entity.isActive,
  };
}

type MaterialsOnlyEntity = Prisma.RawMaterialGetPayload<{
  select: {
    id: true;
    name: true;
    unit: true;
    cost: true;
    isActive: true;
  };
}>;

export function toMaterialsOnlyResponse(entity: MaterialsOnlyEntity) {
  return {
    id: entity.id,
    name: entity.name,
    unit: entity.unit,
    cost: entity.cost ?? 0,
    isActive: entity.isActive,
  };
}

type SimpleMaterialsEntity = Prisma.RawMaterialGetPayload<{
  select: {
    id: true;
    name: true;
  };
}>;

export function toRawMaterialListResponse(entity: SimpleMaterialsEntity) {
  return {
    id: entity.id,
    name: entity.name,
  };
}
