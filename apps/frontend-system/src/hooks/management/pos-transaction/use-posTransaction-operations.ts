import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPosTransaction,
  fetchPosTransactionParked,
  fetchPosTransactions,
  mutatePosTransaction,
  PosTransactionFilters,
  uploadPaymentProof,
} from "@/lib/queries/pos-transaction/pos-transaction.query";
import { toast } from "sonner";

export const usePosTransactionOperations = ({
  filters,
  isTableMode = false,
  isParked = false,
}: {
  filters?: PosTransactionFilters;
  isTableMode?: boolean;
  isParked?: boolean;
}) => {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["pos_transactions"] });

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const fetchPosTransactionsQuery = useQuery({
    queryKey: ["pos_transactions", filters ?? {}],
    queryFn: () => fetchPosTransactions(filters ?? {}),
    enabled: isTableMode,
    throwOnError: true,
  });

  const fetchPosTransactionsParkedQuery = useQuery({
    queryKey: ["pos_transactions"],
    queryFn: () => fetchPosTransactionParked(),
    enabled: isParked,
    throwOnError: true,
  });

  const mutationPosTransaction = useMutation({
    mutationFn: mutatePosTransaction,
    onSuccess: () => {
      invalidate();
      toast.success("Transaksi kasir berhasil dibuat");
    },
    // Jaring pengaman: komponen pembayaran (Cash/Qris/Transfer) sudah
    // menangkap galatnya sendiri lewat try/catch, tapi pemanggil lain
    // (mis. simpan transaksi tertunda) mengandalkan ini satu-satunya.
    onError: showError("Transaksi kasir gagal dibuat"),
  });

  const uploadPaymentProofMutation = useMutation({
    mutationFn: ({
      transPosId,
      formData,
    }: {
      transPosId: string;
      formData: FormData;
    }) => uploadPaymentProof(transPosId, formData),
    onSuccess: () => {
      invalidate();
      toast.success("Bukti pembayaran telah berhasil diupload dan status transaksi sudah diubah ke Terbayar")
    },
    onError: showError("Gagal mengunggah bukti pembayaran"),
  });

  const cancelPosTransactionMutation = useMutation({
    mutationFn: (transId: string[]) => cancelPosTransaction(transId),
    onSuccess: () => {
      invalidate();
      toast.success("Transaksi kasir berhasil dibatalkan");
    },
    onError: showError("Gagal membatalkan transaksi"),
  });

  return {
    fetchPosTransactionsData: fetchPosTransactionsQuery.data,
    fetchPosTransactionsParkedData: fetchPosTransactionsParkedQuery.data,
    mutationPosTransactionData: mutationPosTransaction.mutateAsync,
    uploadPaymentProofData: uploadPaymentProofMutation.mutate,
    isLoadingmutationPosTransactionData: mutationPosTransaction.isPending,
    isLoadingUploadPaymentProofData: uploadPaymentProofMutation.isPending,
    cancelPosTransactionData: cancelPosTransactionMutation.mutate,
  };
};
