import { Prisma } from '@repo/db';

type ProductTableEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
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
        image: true;
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
    status: entity.status,
    slug: entity.slug,
    useVariant: entity.useVariant,
    createdAt: entity.createdAt,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost,
      image: variant.image,
      productVariantStocks: variant.productVariantStocks?.stock,
    })),
  };
}

type ProductEntityById = Prisma.ProductMasterGetPayload<{
  select: {
    name: true;
    description: true;
    useVariant: true;
    status: true;
    variants: {
      select: {
        id: true;
        sku: true;
        price: true;
        cost: true;
        image: true;
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
        values: {
          select: {
            id: true;
            value: true;
          };
        };
      };
    };
  };
}>;

export function toProductResponseById(entity: ProductEntityById) {
  return {
    name: entity.name,
    description: entity.description,
    useVariant: entity.useVariant,
    status: entity.status,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost,
      image: variant.image,
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
      values: varTypes.values.map((val) => ({
        id: val.id,
        value: val.value,
      })),
    })),
  };
}

type ProductEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
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
  };
}>;

export function toProductResponse(entity: ProductEntity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    status: entity.status,
    useVariant: true,
    variants: entity.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price,
      cost: variant.cost,
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
