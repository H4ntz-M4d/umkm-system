import { Prisma } from '@repo/db';

type StoresEntity = Prisma.StoreGetPayload<{
  select: {
    id: true;
    name: true;
    isActive: true;
    createdAt: true;
  };
}>;

export function toStoresResponse(entity: StoresEntity) {
  return {
    id: entity.id,
    name: entity.name,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
  };
}
