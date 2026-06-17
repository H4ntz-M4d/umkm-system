import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  PaymentMethodSchemaInput,
  PaymentResponse,
  PaymentResponseMutate,
} from "@repo/schemas";

export const fetchPayment = async () => {
  return apiFetcher(managementApi.get("v1/payment-method"), PaymentResponse);
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
