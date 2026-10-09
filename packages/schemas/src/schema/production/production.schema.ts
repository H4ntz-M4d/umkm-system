import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";

export const ProductionStatusEnum = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export type ProductionStatusInput = z.infer<typeof ProductionStatusEnum>;

export const ProductionItemSchema = z.object({
  productVariantId: z.string().min(1, "Pilih varian produk"),
  targetQuantity: z.number().int().positive("Jumlah harus lebih dari 0"),
});

/**
 * Batch produksi: beberapa varian sekaligus dengan target masing-masing.
 *
 * Statusnya tidak ikut di sini. Batch baru selalu Direncanakan, lalu
 * bergerak sendiri mengikuti setoran — kalau bisa diisi manual, admin bisa
 * menandai "Dikerjakan" padahal belum ada satu pun barang yang masuk.
 */
export const ProductionSchema = z.object({
  targetDate: z.coerce.date(),
  notes: z.string().optional(),
  items: z
    .array(ProductionItemSchema)
    .min(1, "Tambahkan minimal satu varian")
    .superRefine((items, ctx) => {
      /// Varian ganda hampir selalu salah klik, dan jumlahnya lebih tepat
      /// digabung jadi satu baris daripada dibiarkan terpecah.
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.productVariantId)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "productVariantId"],
            message: "Varian ini sudah ada di daftar",
          });
        }
        seen.add(item.productVariantId);
      });
    }),
});

export const UpdateProductionSchema = ProductionSchema;

/**
 * Satu kali antar hasil produksi.
 *
 * Baris dengan jumlah 0 dibuang: form menampilkan seluruh varian batch, dan
 * yang tidak ikut diantar hari itu wajar dikosongkan.
 */
export const RecordDeliverySchema = z.object({
  deliveredAt: z.coerce.date(),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productionItemId: z.string().min(1),
        quantity: z.number().int().nonnegative(),
      }),
    )
    .min(1, "Tidak ada varian yang disetor")
    .refine(
      (items) => items.some((item) => item.quantity > 0),
      "Isi jumlah minimal satu varian",
    ),
});

/// Menutup batch sebelum targetnya terpenuhi.
export const CloseProductionSchema = z.object({
  /// Membuat batch baru berisi sisa target tiap varian, supaya yang belum
  /// jadi tidak hilang jejaknya.
  createContinuation: z.boolean().default(false),
});

export const ProductionQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: ProductionStatusEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateProductionSchemaInput = z.input<typeof ProductionSchema>;
export type UpdateProductionSchemaInput = z.input<typeof UpdateProductionSchema>;
export type RecordDeliverySchemaInput = z.input<typeof RecordDeliverySchema>;
export type ProductionQueryInput = z.infer<typeof ProductionQuerySchema>;
