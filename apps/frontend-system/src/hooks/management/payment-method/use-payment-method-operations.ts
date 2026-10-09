import {
  createPayment,
  fetchPayment,
  removePayment,
  updatePayment,
  uploadQrisImage,
} from "@/lib/queries/payment-method/payment-method.query";
import { PaymentMethodSchemaInput } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const usePaymentMethodOperations = (storeId?: string | null) => {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["payment-method"] });

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const fetchPaymentQuery = useQuery({
    queryKey: ["payment-method", storeId ?? "all"],
    queryFn: () => fetchPayment(storeId),
  });

  /// Dipakai lewat `mutateAsync` karena form perlu menunggu URL-nya sebelum
  /// bisa menyimpan metode pembayarannya.
  const uploadQrisMutation = useMutation({
    mutationFn: (file: File) => uploadQrisImage(file),
    onError: showError("Gagal mengunggah gambar QR"),
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
    uploadQrisImageAsync: uploadQrisMutation.mutateAsync,
    isUploadingQris: uploadQrisMutation.isPending,
  };
};
