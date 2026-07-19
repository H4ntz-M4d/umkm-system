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
  });

  const cancelPosTransactionMutation = useMutation({
    mutationFn: (transId: string[]) => cancelPosTransaction(transId),
    onSuccess: () => {
      invalidate();
      console.log("Transaksi kasir berhasil dibuat");
    },
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
