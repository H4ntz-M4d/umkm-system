import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  PaymentMethodSchemaInput,
  PaymentResponse,
  PaymentResponseMutate,
  QrisImageResponse,
} from "@repo/schemas";

/// `storeId` menyaring metode milik toko itu ditambah yang berlaku umum.
/// Dikosongkan berarti minta semuanya — dipakai layar pengelolaan.
export const fetchPayment = async (storeId?: string | null) => {
  const query = storeId ? `?storeId=${storeId}` : "";
  return apiFetcher(
    managementApi.get(`v1/payment-method${query}`),
    PaymentResponse,
  );
};

/// Gambar QR diunggah lebih dulu; yang disimpan di metode pembayaran hanya
/// URL-nya, sama seperti sampul blog.
export const uploadQrisImage = async (file: File) => {
  const body = new FormData();
  body.append("image", file);

  const res = await apiFetcher(
    managementApi.post("v1/payment-method/qris-image", { body }),
    QrisImageResponse,
  );

  return res.data.image;
};

export const createPayment = (data: PaymentMethodSchemaInput) => {
  return apiFetcher(
    managementApi.post("v1/payment-method", { json: data }),
    PaymentResponseMutate,
  );
};

export const updatePayment = (id: string, data: PaymentMethodSchemaInput) => {
  return apiFetcher(
    managementApi.put(`v1/payment-method/${id}`, { json: data }),
    PaymentResponseMutate,
  );
};

export const removePayment = (id: string) => {
  return apiFetcher(
    managementApi.delete(`v1/payment-method/${id}`),
    PaymentResponseMutate,
  );
};
