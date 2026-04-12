import { Prisma } from '@repo/db';

type MaterialsEntity = Prisma.RawMaterialGetPayload<{
  select: {
    id: true;
    name: true;
    unit: true;
    isActive: true;
  };
}>;

export function toMaterialsResponse(entity: MaterialsEntity) {
  return {
    id: entity.id,
    name: entity.name,
    unit: entity.unit,
    isActive: entity.isActive,
  };
}

export function toRawMaterialListResponse(entity: MaterialsEntity) {
  return {
    id: entity.id,
    name: entity.name,
  };
}
