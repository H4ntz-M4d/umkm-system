import { Prisma } from '@repo/db';
import {
  publicCardVariantSelect,
  toPublicProductCardResponse,
} from 'products/products/public-products.response';

export const wishlistProductSelect = {
  select: {
    id: true,
    name: true,
    slug: true,
    description: true,
    type: true,
    categoryId: true,
    categories: { select: { name: true } },
    productPreOrderDetail: { select: { maxQuota: true, endDate: true } },
    variants: publicCardVariantSelect,
  },
} satisfies Prisma.ProductMasterDefaultArgs;

type WishlistEntity = Prisma.WishlistGetPayload<{
  select: {
    id: true;
    createdAt: true;
    product: typeof wishlistProductSelect;
  };
}>;

export function toWishlistItemResponse(entity: WishlistEntity) {
  return {
    ...toPublicProductCardResponse(entity.product),
    wishlistId: String(entity.id),
    createdAt: entity.createdAt.toISOString(),
  };
}
