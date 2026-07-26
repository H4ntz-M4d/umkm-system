import {
  fetchTransactionFlow,
  fetchTransactionFlowSummary,
  fetchTransactionFlowSummaryAmountPosAndOrder,
  TransactionFlowFilter,
} from "@/lib/queries/transaction-flow/transaction-flow.query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useTransactionFlowOperations = ({
  filters,
  isTableMode = false,
  isSummaryTransactionMode = false,
  isSummaryAmountPosAndOrder = false,
}: {
  filters?: TransactionFlowFilter;
  isTableMode?: boolean;
  isSummaryTransactionMode?: boolean;
  isSummaryAmountPosAndOrder?: boolean;
}) => {
  const getTransactionFlow = useQuery({
    queryKey: ["transaction-flow", filters ?? {}],
    queryFn: () => fetchTransactionFlow(filters ?? {}),
    placeholderData: keepPreviousData,
    throwOnError: true,
    enabled: isTableMode,
  });

  const getTransactionFlowSummary = useQuery({
    queryKey: ["transaction-flow-summary"],
    queryFn: () => fetchTransactionFlowSummary(),
    enabled: isSummaryTransactionMode,
  });

  const getSummaryAmountPosAndOrder = useQuery({
    queryKey: ["summary-amount-pos-and-order-transaction"],
    queryFn: () => fetchTransactionFlowSummaryAmountPosAndOrder(),
    enabled: isSummaryAmountPosAndOrder,
  });
  return {
    getTransactionFlowData: getTransactionFlow.data,
    getTransactionFlowSummaryData: getTransactionFlowSummary.data,
    getSummaryAmountPosAndOrderData: getSummaryAmountPosAndOrder.data,
  };
};
