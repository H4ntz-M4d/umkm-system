import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPosTransaction,
  fetchPosTransactionParked,
  fetchPosTransactions,
  mutatePosTransaction,
  PosTransactionFilters,
} from "@/lib/queries/pos-transaction/pos-transaction.query";

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
      console.log("Transaksi kasir berhasil dibuat");
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
    mutationPosTransactionData: mutationPosTransaction.mutate,
    cancelPosTransactionData: cancelPosTransactionMutation.mutate,
  };
};
