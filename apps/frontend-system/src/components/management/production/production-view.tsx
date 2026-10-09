"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InputGroupInlineStart } from "@/components/ui/search";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { columnsProduction, PRODUCTION_STATUS_LABEL } from "./column";
import { DataTableProduction } from "./data-table";
import { ProductionFilters } from "@/lib/queries/production/production.query";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { useCanManageMaster } from "@/hooks/management/use-central-store";

interface ProductionViewProps {
  filters: ProductionFilters;
}

export default function ProductionView({ filters }: ProductionViewProps) {
  const { pagination, onPaginationChange } = usePaginationParams();
  const canManage = useCanManageMaster();
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 500);

  const { productionData, removeProductionData } = useProductionOperation({
    filters: {
      ...filters,
      page: pagination.pageIndex,
      limit: pagination.pageSize,
      search: debouncedSearch,
    },
  });

  const updateUrl = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }

    // Filter berubah berarti jumlah halaman ikut berubah; kembali ke halaman 1
    // supaya tidak mendarat di halaman kosong.
    next.delete("page");
    router.push(`${pathName}?${next.toString()}`, { scroll: false });
  };

  const dateRange: DateRange | undefined = filters.dateFrom
    ? {
        from: new Date(filters.dateFrom),
        to: filters.dateTo ? new Date(filters.dateTo) : undefined,
      }
    : undefined;

  const pageCount = productionData?.total
    ? Math.ceil(productionData.total / pagination.pageSize)
    : 1;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <InputGroupInlineStart
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari kode batch, produk, atau SKU..."
        />

        <Select
          value={filters.status || "none"}
          onValueChange={(value) =>
            updateUrl({ status: value === "none" ? undefined : value })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="none">Semua Status</SelectItem>
              {Object.entries(PRODUCTION_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <DatePickerWithRange
          value={dateRange}
          onValueChange={(range) =>
            updateUrl({
              dateFrom: range?.from
                ? format(range.from, "yyyy-MM-dd")
                : undefined,
              dateTo: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
            })
          }
        />
      </div>

      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTableProduction
          columns={columnsProduction(removeProductionData, canManage)}
          data={productionData?.data ?? []}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      </div>
    </>
  );
}
