import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { ProductStatusEnum, ProductTypeEnum } from "./products.schema";
import { Decimal } from "@repo/utils";

export const VariantValuesData = z.object({
  id: z.string(),
  value: z.string(),
});

export const VariantTypesData = z.object({
  id: z.string(),
  name: z.string(),
  isHaveVisual: z.boolean(),
  values: z.array(VariantValuesData),
});

export const ProductImageData = z.object({
  id: z.string(),
  image: z.string(),
  sortOrder: z.number(),
});

export const ImageGroupValueData = z.object({
  id: z.string(),
  value: z.string(),
  typeName: z.string(),
});

export const ImageGroupData = z.object({
  id: z.string(),
  signature: z.string(),
  values: z.array(ImageGroupValueData),
  images: z.array(ProductImageData),
});

/// Cukup untuk memetakan file yang dipegang form ke id grup setelah simpan.
export const ImageGroupRefData = ImageGroupData.pick({
  id: true,
  signature: true,
});

export const VariantData = z.object({
  id: z.string(),
  sku: z.string(),
  price: z.string(),
  cost: z.string(),
  /// Diratakan dari imageGroup.images[0] oleh mapper backend.
  image: z.string().optional().nullable(),
  imageGroupId: z.string().optional().nullable(),
  productVariantStocks: z.number().optional(),
  /// Stok yang dikunci pesanan online Lunas dan menunggu Selesai. Tidak
  /// termasuk di `productVariantStocks` (itu stok bebas).
  reservedStock: z.number().optional(),
});

export const ProductPreOrderDetailData = z.object({
  id: z.string(),
  quotaTarget: z.number(),
  maxQuota: z.number(),
  endDate: z.coerce.date(),
});

export const ProductsData = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: ProductTypeEnum,
  categoryId: z.string().nullable(),
  status: ProductStatusEnum,
  slug: z.string(),
  useVariant: z.boolean(),
  createdAt: z.string(),
  variants: z.array(VariantData),
});

export const ProductDataById = ProductsData.pick({
  name: true,
  description: true,
  useVariant: true,
  categoryId: true,
  type: true,
  status: true,
}).extend({
  variants: z.array(
    VariantData.extend({
      options: z.record(z.string(), z.string()),
    }),
  ),
  variantTypes: z.array(VariantTypesData),
  imageGroups: z.array(ImageGroupData),
  productPreOrderDetail: ProductPreOrderDetailData.optional().nullable(),
});

export const CreateUpdateProductData = ProductsData.pick({
  id: true,
  name: true,
  description: true,
  useVariant: true,
  categoryId: true,
  type: true,
  status: true,
}).extend({
  variants: z.array(
    VariantData.pick({
      id: true,
      sku: true,
      price: true,
      cost: true,
    }),
  ),
  imageGroups: z.array(ImageGroupRefData),
});

export const ProductVariantListData = ProductsData.pick({
  id: true,
  name: true,
}).extend({
  /// Opsional: dipakai isian pencarian varian untuk menandai produk draft
  /// atau nonaktif. Dibuat opsional supaya pemakai lama (form transfer stok)
  /// tidak perlu ikut diubah.
  status: ProductStatusEnum.optional(),
  variants: z.array(
    VariantData.pick({
      id: true,
      sku: true,
    }).extend({
      isActive: z.boolean().default(true),
      optionLabel: z.string().default(""),
    }),
  ),
});

export const OptionsData = z.object({
  productVariantId: z.string().optional(),
  variantValueId: z.string().optional(),
  variantValue: z.object({
    value: z.string().optional(),
  }),
});

export const ProductListData = ProductsData.pick({
  id: true,
  name: true,
  description: true,
  categoryId: true,
  useVariant: true,
}).extend({
  variants: z.array(
    VariantData.omit({
      cost: true,
      productVariantStocks: true,
      reservedStock: true,
    }).extend({
      stock: z.number(),
      options: z.array(OptionsData).optional().nullable(),
    }),
  ),
});

export const AllProductResponse = ApiSuccessResponse(z.array(ProductsData));

export const ProductResponseById = ApiSuccessResponse(ProductDataById);

export const ProductsResponse = ApiSuccessResponse(CreateUpdateProductData);

export const ProductVariantResponse = ApiSuccessResponse(
  z.array(ProductVariantListData),
);

export const ProductListDataResponse = ApiSuccessResponse(
  z.array(ProductListData),
);

export const UploadProductImagesResponse = ApiSuccessResponse(
  z.array(
    z.object({
      imageGroupId: z.string(),
      image: z.string(),
    }),
  ),
);

// ============================ Label barcode ==================================

/**
 * Data untuk mencetak label barcode satu varian.
 *
 * Stok dikirim per toko, bukan dijumlahkan: jumlah label default mengikuti
 * stok di toko yang dipilih, karena label dicetak di tempat barangnya berada.
 * Toko yang belum pernah punya baris stok untuk varian ini tetap ikut dengan
 * stok 0, supaya pilihan tokonya lengkap.
 */
export const VariantLabelData = z.object({
  variantId: z.string(),
  productName: z.string(),
  /// Gabungan nilai varian, mis. "Biru / L". Kosong untuk produk tanpa varian.
  variantLabel: z.string(),
  sku: z.string(),
  price: z.string(),
  stocks: z.array(
    z.object({
      storeId: z.string(),
      storeName: z.string(),
      isProductionHouse: z.boolean(),
      stock: z.number(),
    }),
  ),
});

export type VariantLabelDataType = z.infer<typeof VariantLabelData>;

export const VariantLabelResponse = ApiSuccessResponse(VariantLabelData);

/**
 * Hasil pencarian SKU dari kasir, dipakai saat barcode yang discan tidak ada di
 * daftar produk kasir.
 *
 * Daftar kasir hanya memuat produk aktif yang punya stok di toko itu dan yang
 * lolos filter pencarian/kategori, jadi "tidak ada di daftar" bisa berarti
 * banyak hal. `null` berarti SKU-nya memang tidak dikenal sama sekali.
 */
export const PosSkuLookupData = z
  .object({
    productName: z.string(),
    variantLabel: z.string(),
    isActive: z.boolean(),
    /// Stok di toko tempat kasir bertransaksi.
    stock: z.number(),
  })
  .nullable();

export type PosSkuLookupDataType = z.infer<typeof PosSkuLookupData>;

export const PosSkuLookupResponse = ApiSuccessResponse(PosSkuLookupData);
