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
  variants: z.array(
    VariantData.pick({
      id: true,
      sku: true,
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
