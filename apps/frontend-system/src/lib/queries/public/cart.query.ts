import { customerApi } from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import { CartResponse, type AddCartItemInput } from "@repo/schemas";

/// Dari Server Component cookie tidak ikut otomatis, jadi token dikirim manual
/// sebagai Bearer. Dari browser argumennya dikosongkan dan cookie yang berjalan.
const auth = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

export const fetchCart = async (token?: string) =>
  apiFetcher(customerApi.get("v1/cart", auth(token)), CartResponse);

export const addCartItem = async (data: AddCartItemInput) =>
  apiFetcher(customerApi.post("v1/cart/items", { json: data }), CartResponse);

export const updateCartItem = async (id: string, quantity: number) =>
  apiFetcher(
    customerApi.patch(`v1/cart/items/${id}`, { json: { quantity } }),
    CartResponse,
  );

export const removeCartItem = async (id: string) =>
  apiFetcher(customerApi.delete(`v1/cart/items/${id}`), CartResponse);

/// Dipanggil sekali setelah login untuk memindahkan keranjang guest ke server.
export const mergeCart = async (items: AddCartItemInput[]) =>
  apiFetcher(customerApi.post("v1/cart/merge", { json: { items } }), CartResponse);
