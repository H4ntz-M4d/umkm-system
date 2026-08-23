"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useStockTransferOperation } from "@/hooks/management/stock-transfer/use-stock-transfer-operation";
import { StockTransferFilters } from "@/lib/queries/stock-transfer/stock-transfer.query";
import { columnsStockTransfer } from "./stock-transfer-column";
import StockTransferForm from "./stock-transfer-form";
// Tabel generik penuh, sudah dipakai di halaman inventori pada domain yang sama.
import { DataTableLedgers } from "@/components/management/inventory-ledger/data-table";

const STATUS_OPTIONS = [
  { value: "READY", label: "Siap kirim" },
  { value: "SENT", label: "Dalam perjalanan" },
  { value: "RECEIVED", label: "Diterima" },
  { value: "CANCELLED", label: "Dibatalkan" },
] as const;

export default function StockTransferView({
  filters,
}: {
  filters: StockTransferFilters;
}) {
  const { pagination, onPaginationChange } = usePaginationParams();
  const {
    transfersData,
    isLoadingTransfers,
    createTransfer,
    isCreating,
    sendTransfer,
    receiveTransfer,
    cancelTransfer,
    isMoving,
  } = useStockTransferOperation(filters);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      router.push(`${pathName}?${params.toString()}`, { scroll: false });
    },
    [pathName, router, searchParams],
  );

  const pageCount = transfersData?.meta?.total
    ? Math.ceil(transfersData.meta.total / pagination.pageSize)
    : 1;

  const inTransit = (transfersData?.data ?? []).filter(
    (transfer) => transfer.status === "SENT",
  ).length;

  return (
    <>
      <div className="flex flex-col gap-3 rounded-md bg-primary-foreground px-4 py-3 shadow sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select
            value={filters.status || "none"}
            onValueChange={(value) =>
              updateUrl({ status: value === "none" ? "" : value, page: 1 })
            }
          >
            <SelectTrigger className="w-52 bg-background">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Yang sedang di jalan ditonjolkan: itulah barang yang sudah keluar
              dari rumah produksi tapi belum masuk stok toko mana pun. */}
          {inTransit > 0 && (
            <p className="text-sm text-muted-foreground">
              {inTransit} kiriman sedang dalam perjalanan
            </p>
          )}
        </div>

        <StockTransferForm
          onSubmit={createTransfer}
          isSubmitting={isCreating}
        />
      </div>

      <div className="rounded-xl bg-muted/50 md:min-h-min">
        {isLoadingTransfers && !transfersData ? (
          <p className="p-8 text-center">Loading data ...</p>
        ) : (
          <DataTableLedgers
            columns={columnsStockTransfer(
              sendTransfer,
              receiveTransfer,
              cancelTransfer,
              isMoving,
            )}
            data={transfersData?.data ?? []}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
          />
        )}
      </div>
    </>
  );
}
