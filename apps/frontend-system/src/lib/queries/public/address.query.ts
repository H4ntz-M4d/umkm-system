import { customerApi } from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  CustomerAddressListResponse,
  CustomerAddressResponse,
  type CustomerAddressSchemaInput,
} from "@repo/schemas";

/// Dari Server Component cookie tidak ikut otomatis, jadi token dikirim manual
/// sebagai Bearer. Dari browser argumennya dikosongkan dan cookie yang berjalan.
const auth = (token?: string) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

export const fetchAddresses = async (token?: string) =>
  apiFetcher(
    customerApi.get("v1/addresses", auth(token)),
    CustomerAddressListResponse,
  );

export const createAddress = async (data: CustomerAddressSchemaInput) =>
  apiFetcher(
    customerApi.post("v1/addresses", { json: data }),
    CustomerAddressResponse,
  );

export const updateAddress = async (
  id: string,
  data: Partial<CustomerAddressSchemaInput>,
) =>
  apiFetcher(
    customerApi.put(`v1/addresses/${id}`, { json: data }),
    CustomerAddressResponse,
  );

export const setDefaultAddress = async (id: string) =>
  apiFetcher(
    customerApi.patch(`v1/addresses/${id}/default`),
    CustomerAddressResponse,
  );

export const deleteAddress = async (id: string) =>
  apiFetcher(
    customerApi.delete(`v1/addresses/${id}`),
    CustomerAddressResponse,
  );
