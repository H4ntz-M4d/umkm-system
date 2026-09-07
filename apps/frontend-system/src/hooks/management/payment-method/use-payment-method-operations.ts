import {
  createPayment,
  fetchPayment,
  removePayment,
  updatePayment,
} from "@/lib/queries/payment-method/payment-method.query";
import { PaymentMethodSchemaInput } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePaymentMethodOperations = () => {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["payment-method"] });

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const fetchPaymentQuery = useQuery({
    queryKey: ["payment-method"],
    queryFn: () => fetchPayment(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      invalidate();
      toast.success("Metode pembayaran berhasil dibuat");
    },
    onError: showError("Gagal membuat metode pembayaran"),
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PaymentMethodSchemaInput;
    }) => updatePayment(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Metode pembayaran berhasil diubah");
    },
    onError: showError("Gagal mengubah metode pembayaran"),
  });

  const removePaymentMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => removePayment(id),
    onSuccess: () => {
      invalidate();
      toast.success("Metode pembayaran berhasil dihapus");
    },
    onError: showError("Gagal menghapus metode pembayaran"),
  });

  return {
    fetchPaymentData: fetchPaymentQuery.data,
    createPaymentData: createPaymentMutation.mutate,
    updatePaymentData: updatePaymentMutation.mutate,
    removePaymentData: removePaymentMutation.mutate,
  }
};
