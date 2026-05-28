import { Prisma } from '@repo/db';

type CategoriesEntity = Prisma.CategoriesGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    status: true;
    slug: true;
  };
}>;

export function toCategoriesResponse(entity: CategoriesEntity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    status: entity.status,
    slug: entity.slug,
  };
}
