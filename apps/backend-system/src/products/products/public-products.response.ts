import { Prisma } from '@repo/db';
import { variantImageGroupSelect } from './products.response';

/**
 * Select variant yang dipakai kartu katalog. Cukup harga, stok, dan satu gambar
 * hasil ratakan dari image group.
 */
export const publicCardVariantSelect = {
  select: {
    id: true,
    price: true,
    imageGroupId: true,
    imageGroup: variantImageGroupSelect,
    productVariantStocks: {
      select: { stock: true },
    },
  },
} satisfies Prisma.ProductMaster$variantsArgs;

type VariantWithImageGroup = {
  imageGroup: { images: { image: string }[] } | null;
};

function flattenImage(variant: VariantWithImageGroup) {
  return variant.imageGroup?.images[0]?.image ?? null;
}

/**
 * Ambil rentang harga dari daftar variant. Nilai dikembalikan apa adanya dari
 * Decimal Prisma (diserialisasi jadi string) supaya presisi tidak hilang; angka
 * hasil Number() hanya dipakai untuk membandingkan.
 */
function priceRange(variants: { price: Prisma.Decimal }[]) {
  if (variants.length === 0) return { priceMin: '0', priceMax: '0' };

  let min = variants[0]!;
  let max = variants[0]!;
  for (const variant of variants) {
    if (Number(variant.price) < Number(min.price)) min = variant;
    if (Number(variant.price) > Number(max.price)) max = variant;
  }

  return { priceMin: String(min.price), priceMax: String(max.price) };
}

type PublicProductCardEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    description: true;
    type: true;
    categoryId: true;
    categories: { select: { name: true } };
    variants: typeof publicCardVariantSelect;
  };
}>;

export function toPublicProductCardResponse(entity: PublicProductCardEntity) {
  return {
    id: String(entity.id),
    name: entity.name,
    slug: entity.slug,
    description: entity.description ?? '',
    type: entity.type,
    categoryId: entity.categoryId ? String(entity.categoryId) : null,
    categoryName: entity.categories?.name ?? null,
    // Gambar pertama yang tersedia; produk tanpa variant tetap punya satu grup
    // level produk sehingga jalur ini juga menutupi kasus useVariant = false.
    image: entity.variants.map(flattenImage).find((image) => image) ?? null,
    ...priceRange(entity.variants),
    totalStock: entity.variants.reduce(
      (total, variant) => total + (variant.productVariantStocks?.stock ?? 0),
      0,
    ),
  };
}

export const publicDetailVariantSelect = {
  select: {
    id: true,
    sku: true,
    price: true,
    imageGroupId: true,
    imageGroup: variantImageGroupSelect,
    productVariantStocks: {
      select: { stock: true },
    },
    options: {
      select: {
        variantValue: {
          select: {
            value: true,
            variantType: { select: { name: true } },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductMaster$variantsArgs;

export const publicImageGroupSelect = {
  select: {
    id: true,
    signature: true,
    values: {
      select: {
        variantValue: {
          select: {
            id: true,
            value: true,
            variantType: { select: { name: true } },
          },
        },
      },
    },
    images: {
      select: { id: true, image: true, sortOrder: true },
      orderBy: { sortOrder: 'asc' },
    },
  },
  orderBy: { id: 'asc' },
} satisfies Prisma.ProductMaster$imageGroupsArgs;

export const publicVariantTypeSelect = {
  select: {
    id: true,
    name: true,
    isHaveVisual: true,
    values: {
      select: { id: true, value: true },
    },
  },
} satisfies Prisma.ProductMaster$variantTypesArgs;

type PublicProductDetailEntity = Prisma.ProductMasterGetPayload<{
  select: {
    id: true;
    name: true;
    slug: true;
    description: true;
    type: true;
    useVariant: true;
    categoryId: true;
    categories: { select: { name: true } };
    variants: typeof publicDetailVariantSelect;
    variantTypes: typeof publicVariantTypeSelect;
    imageGroups: typeof publicImageGroupSelect;
  };
}>;

export function toPublicProductDetailResponse(
  entity: PublicProductDetailEntity,
) {
  return {
    id: String(entity.id),
    name: entity.name,
    slug: entity.slug,
    description: entity.description ?? '',
    type: entity.type,
    categoryId: entity.categoryId ? String(entity.categoryId) : null,
    categoryName: entity.categories?.name ?? null,
    image: entity.variants.map(flattenImage).find((image) => image) ?? null,
    ...priceRange(entity.variants),
    totalStock: entity.variants.reduce(
      (total, variant) => total + (variant.productVariantStocks?.stock ?? 0),
      0,
    ),
    useVariant: entity.useVariant,
    variants: entity.variants.map((variant) => ({
      id: String(variant.id),
      sku: variant.sku,
      price: String(variant.price),
      image: flattenImage(variant),
      imageGroupId: variant.imageGroupId
        ? String(variant.imageGroupId)
        : null,
      stock: variant.productVariantStocks?.stock ?? 0,
      options: Object.fromEntries(
        variant.options.map((opt) => [
          opt.variantValue.variantType.name,
          opt.variantValue.value,
        ]),
      ),
    })),
    variantTypes: entity.variantTypes.map((variantType) => ({
      id: String(variantType.id),
      name: variantType.name,
      isHaveVisual: variantType.isHaveVisual,
      values: variantType.values.map((value) => ({
        id: String(value.id),
        value: value.value,
      })),
    })),
    imageGroups: entity.imageGroups.map((group) => ({
      id: String(group.id),
      signature: group.signature,
      values: group.values.map((groupValue) => ({
        id: String(groupValue.variantValue.id),
        value: groupValue.variantValue.value,
        typeName: groupValue.variantValue.variantType.name,
      })),
      images: group.images.map((image) => ({
        id: String(image.id),
        image: image.image,
        sortOrder: image.sortOrder,
      })),
    })),
  };
}
