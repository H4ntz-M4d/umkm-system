"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { Search } from "lucide-react";
import { DataTablePosTransaction } from "./pos-transaction-data-table";
import { columnsPosTransaction } from "./pos-transaction-column";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { PosTransactionFilters } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
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
