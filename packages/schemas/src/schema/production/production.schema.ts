import z from "zod";
import { BeSpokeSchema } from "../be-spoke/be-spoke.schema";

export const ProductionType = z.enum([
  "RESTOCK",
  "MADE_TO_ORDER",
  "BE_SPOKE",
  "PRE_ORDER",
]);

export const ProductionSchema = z.object({
  storeId: z.number().positive("Pilih toko dari produk yang ingin diproduksi"),
  producedVariantId: z.string().optional(),
  quantityProduced: z.number(),
  type: ProductionType,
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  notes: z.string().optional(),
  targetDate: z.coerce.date(),
  bespoke: BeSpokeSchema.optional(),
});

export const ProductionBeSpokeSchema = ProductionSchema.superRefine(
  (val, ctx) => {
    if (val.type === "BE_SPOKE") {
      if (!val.bespoke?.name || val.bespoke.name.trim().length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["bespoke", "name"],
          message: "Nama minimal memiliki panjang 3 karakter",
        });
      }
      if (!val.bespoke?.email || val.bespoke.email.trim().length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["bespoke", "email"],
          message: "Email wajib diisi untuk BE SPOKE",
        });
      }
      if (!val.bespoke?.phone || val.bespoke.phone.trim().length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["bespoke", "phone"],
          message: "Nomor minimal memiliki panjang 10 karakter",
        });
      }
      if (!val.bespoke?.title || val.bespoke.title.trim().length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["bespoke", "title"],
          message: "Title wajib diisi untuk BE SPOKE",
        });
      }
      if (!val.bespoke?.quotedPrice) {
        ctx.addIssue({
          code: "custom",
          path: ["bespoke", "quotedPrice"],
          message: "Harga usulan wajib diisi untuk BE SPOKE",
        });
      }
    }
  },
);

export const UpdateProductionSchema = ProductionSchema.partial();

export type CreateProductionSchemaInput = z.infer<typeof ProductionSchema>;
export type UpdateProductionSchemaInput = z.infer<
  typeof UpdateProductionSchema
>;

export type ProductionBeSpokeSchemaInput = z.infer<
  typeof ProductionBeSpokeSchema
>;
