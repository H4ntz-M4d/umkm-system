import {
  fetchTransactionFlow,
  fetchTransactionFlowSummary,
  TransactionFlowFilter,
} from "@/lib/queries/transaction-flow/transaction-flow.query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useTransactionFlowOperations = ({
  filters,
}: {
  filters?: TransactionFlowFilter;
}) => {
  const getTransactionFlow = useQuery({
    queryKey: ["transaction-flow", filters ?? {}],
    queryFn: () => fetchTransactionFlow(filters ?? {}),
    placeholderData: keepPreviousData,
    throwOnError: true
  });

  const getTransactionFlowSummary = useQuery({
    queryKey: ["transaction-flow-summary"],
    queryFn: () => fetchTransactionFlowSummary(),
  });

  return {
    getTransactionFlowData: getTransactionFlow.data,
    getTransactionFlowSummaryData: getTransactionFlowSummary.data,
  };
};
