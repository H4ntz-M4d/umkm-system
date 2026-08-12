"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useDebounce } from "@/hooks/use-debounce";
import { LowStockFilters } from "@/lib/queries/inventory-ledgers/low-stock.query";
import { useLowStockOperation } from "@/hooks/management/inventory-ledgers/use-low-stock-operation";
import { columnsLowStock } from "./low-stock-column";
// Tabel ini generik penuh dan sudah dipakai di halaman inventori pada domain
// yang sama, jadi dipakai ulang daripada disalin.
import { DataTableLedgers } from "@/components/management/inventory-ledger/data-table";

export default function LowStockView({
  filters,
}: {
  filters: LowStockFilters;
}) {
  const { pagination, onPaginationChange } = usePaginationParams();
  const { dataLowStock, isLoadingLowStock } = useLowStockOperation(filters);
  const { storeList } = useStoreOperations({ enableStoreList: true });

  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 500);
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

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateUrl({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, filters.search, updateUrl]);

  const pageCount = dataLowStock?.meta?.total
    ? Math.ceil(dataLowStock.meta.total / pagination.pageSize)
    : 1;

  return (
    <>
      <div className="flex sm:flex-row flex-col gap-3 items-center justify-between bg-primary-foreground py-3 px-4 rounded-md shadow">
        <InputGroup className="lg:max-w-sm w-full bg-background">
          <InputGroupInput
            placeholder="Cari nama produk atau SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>

        <div className="flex items-center gap-3">
          {/* Tanpa filter, seluruh toko ikut tampil — dan memang itu yang
              dibutuhkan untuk melihat gambaran menyeluruh. */}
          <Select
            value={filters.storeId || "none"}
            onValueChange={(value) =>
              updateUrl({ storeId: value === "none" ? "" : value, page: 1 })
            }
          >
            <SelectTrigger className="w-52 bg-background">
              <SelectValue placeholder="Semua toko" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua toko</SelectItem>
              {storeList?.data.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {dataLowStock?.meta?.total ?? 0} varian perlu diperhatikan
          </p>
        </div>
      </div>
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        {isLoadingLowStock && !dataLowStock ? (
          <p className="p-8 text-center">Loading data ...</p>
        ) : (
          <DataTableLedgers
            columns={columnsLowStock()}
            data={dataLowStock?.data ?? []}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
          />
        )}
      </div>
    </>
  );
}
