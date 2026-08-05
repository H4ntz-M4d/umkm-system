import z from "zod";

export const ProductStatusEnum = z.enum(["ACTIVE", "NONACTIVE", "DRAFT"]);
export const ProductTypeEnum = z.enum([
  "READY_STOCK",
  "MADE_TO_ORDER",
  "PRE_ORDER",
]);

export const VariantValueSchema = z
  .string()
  .min(1, "Nilai dari variant minimal memiliki panjang 1 karakter");

export const VariantTypeSchema = z.object({
  name: z.string().min(3, "Nama variant minimal memiliki panjang 3 karakter"),
  values: z.array(VariantValueSchema).min(1),
  /// Tipe yang mengubah tampilan produk (Warna, Motif). Hanya tipe visual yang
  /// ikut membentuk Image Group. Biarkan false untuk Ukuran dan sejenisnya.
  ///
  /// optional, bukan default(false), supaya tipe input dan output z.infer tetap
  /// sama. default() membuat keduanya berbeda dan zodResolver menolaknya.
  /// Backend memperlakukan undefined sebagai false.
  isHaveVisual: z.boolean().optional(),
});

export const VariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(3, "SKU wajib diisi dan tidak boleh ada yang sama"),
  price: z.number(),
  cost: z.number(),
  options: z.record(z.string(), z.string()),
});

export const ProductPreOrderDetailSchema = z
  .object({
    quotaTarget: z
      .number({ error: "Target kuota wajib diisi" })
      .int("Target kuota harus berupa bilangan bulat")
      .min(1, "Target minimum setidaknya 1 pcs"),

    maxQuota: z
      .number({ error: "Maksimum kuota wajib diisi" })
      .int("Maksimum kuota harus berupa bilangan bulat")
      .min(1, "Maksimum kuota setidaknya 1 pcs"),

    endDate: z.coerce
      .date({ error: "Format tanggal tidak valid" })
      .refine((date) => date > new Date(), {
        message: "Tanggal berakhir PO harus di masa mendatang",
      }),
  })
  .refine((val) => val.quotaTarget <= val.maxQuota, {
    message: "Target minimum tidak boleh lebih besar dari batas maksimum kuota",
    path: ["maxQuota"],
  });

export const BaseProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal memiliki panjang 3 karakter"),
  description: z
    .string()
    .min(5, "Deskripsi minimal memiliki panjang 5 karakter"),
  useVariant: z.boolean(),
  categoryId: z.string(),
  type: ProductTypeEnum,
  status: ProductStatusEnum,
  variants: z.array(VariantSchema).optional(),
  variantsTypes: z.array(VariantTypeSchema).optional(),
  productPreOrderDetail: ProductPreOrderDetailSchema.optional(),
});

export const ProductSchema = BaseProductSchema.superRefine((val, ctx) => {
  if (val.type === "PRE_ORDER") {
    if (!val.productPreOrderDetail) {
      ctx.addIssue({
        code: "custom",
        message:
          "Detail Pre-Order wajib diisi jika tipe produk merupakan Pre-Order",
        path: ["productPreOrderDetail"],
      });
      return;
    }
    const result = ProductPreOrderDetailSchema.safeParse(
      val.productPreOrderDetail,
    );
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ["productPreOrderDetail", ...issue.path],
        });
      });
    }
  }
});

export type CreateProductSchemaInput = z.input<typeof ProductSchema>;

export const UpdateProductSchema = ProductSchema;
export type UpdateProductSchemaInput = z.infer<typeof UpdateProductSchema>;
