import { customerApi } from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  ToggleWishlistResponse,
  WishlistIdsResponse,
  WishlistListResponse,
} from "@repo/schemas";

/// Dari Server Component cookie tidak ikut otomatis, jadi token dikirim manual
/// sebagai Bearer. Dari browser argumennya dikosongkan dan cookie yang berjalan.
const auth = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

export const fetchWishlist = async (token?: string) =>
  apiFetcher(customerApi.get("v1/wishlist", auth(token)), WishlistListResponse);

export const fetchWishlistIds = async (token?: string) =>
  apiFetcher(customerApi.get("v1/wishlist/ids", auth(token)), WishlistIdsResponse);

export const toggleWishlist = async (productMasterId: string) =>
  apiFetcher(
    customerApi.post("v1/wishlist/toggle", { json: { productMasterId } }),
    ToggleWishlistResponse,
  );
