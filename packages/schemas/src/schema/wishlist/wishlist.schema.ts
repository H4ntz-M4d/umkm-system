import z from "zod";

export const ToggleWishlistSchema = z.object({
  productMasterId: z.string(),
});

export type ToggleWishlistInput = z.infer<typeof ToggleWishlistSchema>;
