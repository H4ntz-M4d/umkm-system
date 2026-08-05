import { Prisma } from '@repo/db';

/**
 * Fragmen select untuk meratakan gambar grup menjadi satu field `image` pada
 * variant. Dipakai di semua query baca supaya sisi pembaca tidak perlu menyusuri
 * imageGroup.images sendiri.
 */
export const variantImageGroupSelect = {
  select: {
    id: true,
    images: {
      select: { image: true },
      orderBy: { sortOrder: 'asc' },
      take: 1,
    },
  },
} satisfies Prisma.ProductVariant$imageGroupArgs;

type VariantWithImageGroup = {
  imageGroupId: bigint | null;
  imageGroup: { images: { image: string }[] } | null;
};

function flattenImage(variant: VariantWithImageGroup) {
  return variant.imageGroup?.images[0]?.image ?? null;
}

type ProductTableEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    categoryId: true;
    type: true;
    status: true;
    slug: true;
    useVariant: true;
    createdAt: true;
    variants: {
      select: {
        id: true;
        sku: true;
        price: true;
        cost: true;
        imageGroupId: true;
        imageGroup: typeof variantImageGroupSelect;
        productVariantStocks: {
          select: {
            id: true;
            stock: true;
          };
        };
      };
    };
  };
}>;

export function toAllProductsResponse(entity: ProductTableEntity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    categoryId: entity.categoryId,
    type: entity.type,
    status: entity.status,
    slug: entity.slug,
    useVariant: entity.useVariant,
    createdAt: entity.createdAt,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost,
      image: flattenImage(variant),
      imageGroupId: variant.imageGroupId,
      productVariantStocks: variant.productVariantStocks?.stock,
    })),
  };
}

type ProductEntityById = Prisma.ProductMasterGetPayload<{
  select: {
    name: true;
    description: true;
    useVariant: true;
    categoryId: true;
    type: true;
    status: true;
    variants: {
      select: {
        id: true;
        sku: true;
        price: true;
        cost: true;
        imageGroupId: true;
        imageGroup: typeof variantImageGroupSelect;
        options: {
          select: {
            variantValue: {
              select: {
                value: true;
                variantType: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    variantTypes: {
      select: {
        id: true;
        name: true;
        isHaveVisual: true;
        values: {
          select: {
            id: true;
            value: true;
          };
        };
      };
    };
    imageGroups: {
      select: {
        id: true;
        signature: true;
        values: {
          select: {
            variantValue: {
              select: {
                id: true;
                value: true;
                variantType: { select: { name: true } };
              };
            };
          };
        };
        images: {
          select: { id: true; image: true; sortOrder: true };
        };
      };
    };
    productPreOrderDetail: true;
  };
}>;

export function toProductResponseById(entity: ProductEntityById) {
  return {
    name: entity.name,
    description: entity.description,
    useVariant: entity.useVariant,
    categoryId: entity.categoryId,
    type: entity.type,
    status: entity.status,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost,
      image: flattenImage(variant),
      imageGroupId: variant.imageGroupId,
      options: Object.fromEntries(
        variant.options.map((opt) => [
          opt.variantValue.variantType.name,
          opt.variantValue.value,
        ]),
      ),
    })),
    variantTypes: entity.variantTypes.map((varTypes) => ({
      id: varTypes.id,
      name: varTypes.name,
      isHaveVisual: varTypes.isHaveVisual,
      values: varTypes.values.map((val) => ({
        id: val.id,
        value: val.value,
      })),
    })),
    imageGroups: entity.imageGroups.map((group) => ({
      id: group.id,
      signature: group.signature,
      values: group.values.map((groupValue) => ({
        id: groupValue.variantValue.id,
        value: groupValue.variantValue.value,
        typeName: groupValue.variantValue.variantType.name,
      })),
      images: group.images.map((image) => ({
        id: image.id,
        image: image.image,
        sortOrder: image.sortOrder,
      })),
    })),
    productPreOrderDetail: entity.productPreOrderDetail,
  };
}

type ProductEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    categoryId: true;
    type: true;
    status: true;
    useVariant: true;
    variants: {
      select: {
        id: true;
        sku: true;
        price: true;
        cost: true;
      };
    };
    imageGroups: {
      select: {
        id: true;
        signature: true;
      };
    };
  };
}>;

export function toProductResponse(entity: ProductEntity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    categoryId: entity.categoryId,
    type: entity.type,
    status: entity.status,
    useVariant: entity.useVariant,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost,
    })),
    // Dipakai form untuk memetakan file yang dipegangnya ke id grup, tanpa
    // bergantung pada urutan indeks variant.
    imageGroups: entity.imageGroups.map((group) => ({
      id: group.id,
      signature: group.signature,
    })),
  };
}

type ProductVariantListEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    variants: {
      select: {
        id: true;
        sku: true;
      };
    };
  };
}>;

export function toProductVariantListResponse(entity: ProductVariantListEntity) {
  return {
    id: entity.id,
    name: entity.name,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
    })),
  };
}

type ProductListEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    categoryId: true;
    name: true;
    description: true;
    useVariant: true;
    variants: {
      select: {
        id: true;
        sku: true;
        price: true;
        imageGroupId: true;
        imageGroup: typeof variantImageGroupSelect;
        productVariantStocks: {
          select: {
            stock: true;
          };
        };
        options: {
          select: {
            productVariantId: true;
            variantValueId: true;
            variantValue: {
              select: {
                value: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export function toProductListResponse(entity: ProductListEntity) {
  return {
    id: entity.id,
    categoryId: entity.categoryId,
    name: entity.name,
    description: entity.description,
    useVariant: entity.useVariant,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      image: flattenImage(variant),
      stock: variant.productVariantStocks?.stock ?? 0,
      options: variant.options,
    })),
  };
}
