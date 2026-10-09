import { customerApi } from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  CheckoutResponse,
  CustomerOrderDetailResponse,
  CustomerOrderListResponse,
  SubmitOrderResponse,
  type CheckoutInput,
  type MyOrderQueryInput,
  type SubmitOrderInput,
} from "@repo/schemas";

/// Dari Server Component cookie tidak ikut otomatis, jadi token dikirim manual
/// sebagai Bearer. Dari browser argumennya dikosongkan dan cookie yang berjalan.
const auth = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/**
 * Mengajukan pesanan dari katalog.
 *
 * Boleh dipanggil tanpa sesi: tamu cukup menyertakan nama dan nomor WhatsApp.
 * Isi keranjang ikut dikirim karena keranjang tamu tidak pernah sampai ke
 * server — harganya tetap dihitung ulang di sana.
 */
export const submitOrder = async (data: SubmitOrderInput) =>
  apiFetcher(
    customerApi.post("v1/orders/submit", { json: data }),
    SubmitOrderResponse,
  );

/**
 * Checkout bayar-online lama — DINONAKTIFKAN, rutenya sudah dicabut di backend
 * sehingga pemanggilan ini akan 404. Sengaja tidak dihapus supaya alur lama
 * bisa dihidupkan kembali tanpa menulis ulang.
 */
export const checkout = async (data: CheckoutInput) =>
  apiFetcher(
    customerApi.post("v1/orders/checkout", { json: data }),
    CheckoutResponse,
  );

export const fetchMyOrders = async (
  params: MyOrderQueryInput = {},
  token?: string,
) => {
  const searchParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number>;

  return apiFetcher(
    customerApi.get("v1/orders/me", { searchParams, ...auth(token) }),
    CustomerOrderListResponse,
  );
};

/// Menanyakan status sebenarnya ke Midtrans lalu menyelaraskan pesanan —
/// jaring pengaman kalau notifikasi webhook tidak pernah sampai.
export const syncOrderPayment = async (orderId: string) =>
  customerApi.post(`v1/orders/me/${orderId}/sync`).json<unknown>();

export const fetchMyOrderDetail = async (orderId: string, token?: string) =>
  apiFetcher(
    customerApi.get(`v1/orders/me/${orderId}`, auth(token)),
    CustomerOrderDetailResponse,
  );
