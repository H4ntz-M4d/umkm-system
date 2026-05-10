import { columnsExpense } from "@/components/management/expense/expenses-columns";
import { DataTableExpense } from "@/components/management/expense/expenses-table";
import { AddExpenseDialog } from "@/components/management/expense/expense-form";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";

export default function ExpenseView() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const { fetchExpenseData } = useExpenseOperation({
    pagination,
    search: debouncedSearch,
  });

  const pageCount = fetchExpenseData?.total
    ? Math.ceil(fetchExpenseData?.total / pagination.pageSize)
    : 1;

  return (
    <>
      <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5 bg-primary-foreground py-3 px-4 rounded-md shadow">
        <div className="flex items-center gap-3 w-full">
          <InputGroupInlineStart
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <DatePickerWithRange />
          <Select>
            <SelectTrigger className="w-30">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Item 1</SelectItem>
              <SelectItem value="1">Item 2</SelectItem>
              <SelectItem value="1">Item 3</SelectItem>
              <SelectItem value="1">Item 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTableExpense
          columns={columnsExpense()}
          data={fetchExpenseData?.data ?? []}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      </div>
    </>
  );
}
