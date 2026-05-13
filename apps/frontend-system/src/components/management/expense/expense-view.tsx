import { columnsExpense } from "@/components/management/expense/expenses-columns";
import { DataTableExpense } from "@/components/management/expense/expenses-table";
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { InputGroupInlineStart } from "@/components/ui/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useExpenseOperation } from "@/hooks/management/expense/use-expense-operations";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ExpenseFilters } from "@/lib/queries/expense/expense.query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useExpenseCategoriesOperation } from "@/hooks/management/expense/use-expense-categories-operations";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

export default function ExpenseView({ filters }: { filters: ExpenseFilters }) {
  const { pagination, onPaginationChange } = usePaginationParams();

  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const { fetchExpenseData, removeExpenseData } = useExpenseOperation({ filters });
  const { dataExpenseCategories } = useExpenseCategoriesOperation({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const router = useRouter();
  const pathName = usePathname();

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

  const pageCount = fetchExpenseData?.total
    ? Math.ceil(fetchExpenseData?.total / pagination.pageSize)
    : 1;

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!startDate) return undefined;

    return {
      from: new Date(startDate),
      to: endDate ? new Date(endDate) : undefined,
    };
  }, [startDate, endDate]);

  const handleDatePicker = (range: DateRange | undefined) => {
    updateUrl({
      startDate: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      endDate: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
      page: 0,
    });
  };

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateUrl({
        search: debouncedSearch,
        page: 0,
      });
    }
  }, [debouncedSearch, filters.search, updateUrl]);

  return (
    <>
      <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5 bg-primary-foreground py-3 px-4 rounded-md shadow">
        <div className="flex items-center gap-3 w-full">
          <InputGroupInlineStart
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DatePickerWithRange
            value={dateRange}
            onValueChange={handleDatePicker}
          />

          <Select
            value={filters.category}
            onValueChange={(value) => {
              if (value === "none") {
                updateUrl({ category: "", page: 0 });
              } else {
                updateUrl({ category: value, page: 0 });
              }
            }}
          >
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua Kategori</SelectItem>
              {dataExpenseCategories?.data?.map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTableExpense
          columns={columnsExpense(removeExpenseData)}
          data={fetchExpenseData?.data ?? []}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      </div>
    </>
  );
}
