import {
  fetchInventoryLedger,
  getSummary,
  LedgerFilters,
} from "@/lib/queries/inventory-ledgers/inventory-ledgers.query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const useLedgerOperation = (filters: LedgerFilters) => {
  const getSummaryQuery = useQuery({
    queryKey: ["inventory-ledgers-summary"],
    queryFn: () => getSummary(),
  });

  const getLedgerQuery = useQuery({
    queryKey: ["inventory-ledgers", filters],
    queryFn: () => fetchInventoryLedger(filters),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  return {
    dataSummary: getSummaryQuery.data,
    isLoadingSummary: getSummaryQuery.isLoading,
    dataLedger: getLedgerQuery.data,
    isLoadingLedger: getLedgerQuery.isLoading,
  };
};
