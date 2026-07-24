"use client";

import { columnsTransactionFlow } from "@/components/management/transaction-flow/transaction-flow-column";
import { DataTableTransactionFlow } from "@/components/management/transaction-flow/transaction-flow-data-table";
import TransactionFlowFilterComponents from "@/components/management/transaction-flow/transaction-flow-filters";
import TransactionFlowSummaryComponents from "@/components/management/transaction-flow/transaction-flow-summary";
import { useTransactionFlowOperations } from "@/hooks/management/transaction-flow/use-transaction-flow-operations";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { TransactionFlowFilter } from "@/lib/queries/transaction-flow/transaction-flow.query";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const searchParams = useSearchParams();
  const filters: TransactionFlowFilter = {
    limit: pagination.pageSize,
    page: pagination.pageIndex,
    source: searchParams.get("source") || "",
    store: searchParams.get("store") || "",
    type: searchParams.get("type") || "",
  };

  const { getTransactionFlowData } = useTransactionFlowOperations({ filters });

  const pageCount = getTransactionFlowData?.meta.total
    ? Math.ceil(getTransactionFlowData?.meta.total / pagination.pageSize)
    : 1;

  return (
    <main className="flex flex-1 flex-col gap-4 py-4 px-6 pt-0">
      <div className="my-5 flex flex-row justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-4xl font-instrument">Alur Transaksi</h2>
          <p className="text-sm">
            Melihat lalu lintas dari transaksi yang terjadi
          </p>
        </div>
      </div>
      <TransactionFlowSummaryComponents filters={filters} />
      <TransactionFlowFilterComponents
        filters={filters}
        searchParams={searchParams}
      />
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTableTransactionFlow
          columns={columnsTransactionFlow()}
          data={getTransactionFlowData?.data ?? []}
          pageCount={pageCount}
          onPaginationChange={onPaginationChange}
          pagination={pagination}
        />
      </div>
    </main>
  );
}
