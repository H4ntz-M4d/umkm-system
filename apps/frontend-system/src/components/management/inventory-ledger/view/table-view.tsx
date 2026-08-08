import { DataTableLedgers } from "../data-table";
import { columnsLedgers } from "../columns";
import { LedgerFilters } from "@/lib/queries/inventory-ledgers/inventory-ledgers.query";
import { useCallback } from "react";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { InventoryLedgerResponse, z } from "@repo/schemas";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import InventoryLedgerFilter from "./inventory-ledger-filter";

type InventoryLedgerData = z.infer<typeof InventoryLedgerResponse>;

interface TableViewProps {
  data: InventoryLedgerData;
  isLoading: boolean;
  currentFilters: LedgerFilters;
}

export default function TableView({
  data,
  isLoading,
  currentFilters,
}: TableViewProps) {
  const { pagination, onPaginationChange } = usePaginationParams();
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      router.push(`${pathName}?${params.toString()}`, { scroll: false });
    },
    [pathName, router, searchParams],
  );

  const pageCount = data?.meta?.total
    ? Math.ceil(data?.meta?.total / pagination.pageSize)
    : 1;

  return (
    <>
      <InventoryLedgerFilter
        currentFilters={currentFilters}
        updateUrl={updateUrl}
      />
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        {isLoading ? (
          <p className="text-center">Loading ...</p>
        ) : (
          <DataTableLedgers
            columns={columnsLedgers()}
            data={data?.data ?? []}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
          />
        )}
      </div>
    </>
  );
}
