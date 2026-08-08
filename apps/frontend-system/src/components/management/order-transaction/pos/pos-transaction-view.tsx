"use client";

import { DataTablePosTransaction } from "./pos-transaction-data-table";
import { columnsPosTransaction } from "./pos-transaction-column";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { PosTransactionFilters } from "@/lib/queries/pos-transaction/pos-transaction.query";
import PosTransactionFiltersComponent from "./pos-transaction-filters";

interface PosTransactionViewProps {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  onPaginationChange: (val: any) => void;
  posFilters?: PosTransactionFilters;
  handleUpdateParams: (key: string, val: string | number | undefined) => void;
}
export default function PosTransactionView({
  pagination,
  onPaginationChange,
  posFilters,
  handleUpdateParams,
}: PosTransactionViewProps) {
  const { fetchPosTransactionsData } = usePosTransactionOperations({
    isTableMode: true,
    filters: posFilters,
  });
  const posTransData = fetchPosTransactionsData?.data;
  const pageCount = fetchPosTransactionsData?.meta.total
    ? Math.ceil(fetchPosTransactionsData?.meta.total / pagination.pageSize)
    : 1;

  return (
    <main className="flex flex-col flex-1 gap-2">
      <PosTransactionFiltersComponent
        handleUpdateParams={handleUpdateParams}
        posFilters={posFilters}
      />
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTablePosTransaction
          columns={columnsPosTransaction()}
          data={posTransData ?? []}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          pageCount={pageCount}
        />
      </div>
    </main>
  );
}
