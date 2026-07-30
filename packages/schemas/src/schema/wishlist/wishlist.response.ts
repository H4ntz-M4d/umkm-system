import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { PublicProductCardData } from "../storefront/storefront.response";

/// Superset dari PublicProductCardData supaya kartu wishlist bisa dirender
/// dengan komponen ProductCard yang sama persis dengan katalog.
export const WishlistItemData = PublicProductCardData.extend({
  wishlistId: z.string(),
  createdAt: z.string(),
});

export type WishlistItemDataType = z.infer<typeof WishlistItemData>;

export const WishlistListResponse = ApiSuccessResponse(
  z.array(WishlistItemData),
);

export const ToggleWishlistData = z.object({
  inWishlist: z.boolean(),
});

export const ToggleWishlistResponse = ApiSuccessResponse(ToggleWishlistData);

/// Hanya daftar id produk, dipakai kartu katalog & halaman detail untuk
/// menandai ikon hati tanpa perlu menarik seluruh isi wishlist.
export const WishlistIdsResponse = ApiSuccessResponse(z.array(z.string()));
