import z from "zod";

export const AddCartItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number().int().positive(),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

/// Dikirim sekali setelah login, isinya snapshot cart guest dari localStorage.
export const MergeCartSchema = z.object({
  items: z.array(AddCartItemSchema),
});

export type AddCartItemInput = z.infer<typeof AddCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type MergeCartInput = z.infer<typeof MergeCartSchema>;
