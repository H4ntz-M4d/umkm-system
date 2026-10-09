import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  PosAbandonQrisResponse,
  PosCancelResponse,
  PosPaymentProofResponse,
  PosTransactionGetStatusResponse,
  PosTransactionResponse,
  PosTransactionResponseMutation,
  PosTransactionSchemaInput,
  PosTransactionsParkedResponse,
} from "@repo/schemas";

export interface PosTransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  paymentChannel?: string;
  storeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchPosTransactions = async (filters: PosTransactionFilters) => {
  /**
   * `page` diterjemahkan jadi `skip` di sini.
   *
   * Backend (PaginationSchema) hanya membaca `skip` dan `limit` — `page`
   * diabaikan diam-diam, jadi dulu `skip` selalu 0 dan tabel terus
   * menampilkan halaman pertama berapa pun halaman yang dipilih. Sama seperti
   * `fetchOrders`, yang sejak awal menghitung `skip = pageIndex * pageSize`.
   */
  const { page, ...rest } = filters;
  const limit = rest.limit ?? 10;

  // Dulu `v !== undefined || v !== ""` — selalu benar, jadi tidak ada yang
  // pernah tersaring. Nilai kosong kini benar-benar dibuang dari URL.
  const filter = Object.fromEntries(
    Object.entries({ ...rest, limit, skip: (page ?? 0) * limit })
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  );
  const queryFilters = new URLSearchParams(filter).toString();
  return await apiFetcher(
    managementApi.get(`v1/pos-transactions?${queryFilters}`),
    PosTransactionResponse,
  );
};

export const fetchPosTransactionParked = async () => {
  return await apiFetcher(
    managementApi.get("v1/pos-transactions/parked"),
    PosTransactionsParkedResponse,
  );
};

export const getStatusTransaction = async (transPosId: string) => {
  return await apiFetcher(
    managementApi.get(`v1/pos-transactions/${transPosId}/check-status`),
    PosTransactionGetStatusResponse,
  );
};

export const mutatePosTransaction = async (data: PosTransactionSchemaInput) => {
  return await apiFetcher(
    managementApi.post("v1/pos-transactions", { json: data }),
    PosTransactionResponseMutation,
  );
};

/// Lewat apiFetcher supaya penolakan dari backend (mis. "Transaksi ini sudah
/// lunas") sampai utuh ke kasir, bukan galat HTTP generik.
export const uploadPaymentProof = async (
  transPosId: string,
  formData: FormData,
) =>
  apiFetcher(
    managementApi.post(`v1/pos-transactions/${transPosId}/upload-paymentProof`, {
      body: formData,
      /// Bawaan ky cuma 10 detik. Unggahan foto lewat jaringan kasir yang
      /// pas-pasan kerap lebih lama, dan yang menyerah duluan adalah
      /// permintaannya — backend tetap menyelesaikan unggahan ke Cloudinary,
      /// sehingga kasir melihat "timeout" padahal datanya tersimpan.
      timeout: 120_000,
    }),
    PosPaymentProofResponse,
  );

/**
 * Membatalkan QR yang ditinggal kasir — dialog ditutup atau QR dibuat ulang.
 *
 * Batas waktunya pendek: dipanggil saat dialog menutup, jadi tidak boleh
 * menggantung lama. Kalau gagal, QR-nya tetap kadaluarsa sendiri dalam
 * hitungan menit.
 */
export const abandonQrisTransaction = async (transPosId: string) =>
  apiFetcher(
    managementApi.patch(`v1/pos-transactions/${transPosId}/abandon-qris`, {
      timeout: 15_000,
    }),
    PosAbandonQrisResponse,
  );

/// Lewat apiFetcher supaya penolakan (mis. "Transaksi yang sudah dibayar tidak
/// bisa dibatalkan") sampai ke kasir, bukan galat HTTP generik.
export const cancelPosTransaction = async (transId: string[]) =>
  apiFetcher(
    managementApi.patch("v1/pos-transactions/cancelled", { json: transId }),
    PosCancelResponse,
  );
