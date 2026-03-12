"use client";

import { columnsEmployee } from "@/components/management/users/employee/column";
import { InputGroupInlineStart } from "@/components/ui/search";
import { Toaster } from "@/components/ui/sonner";
import { useUsersOperation } from "@/hooks/management/users/use-users-operation";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { DataTableCustomer } from "./data-table";
import { columnsCustomer } from "./column";

export default function CustomerManagementView() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const { dataCustomer, isLoadingCustomer } = useUsersOperation({ pagination });
  const pageCount = dataCustomer?.total
    ? Math.ceil(dataCustomer?.total / pagination.pageSize)
    : -1;

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
          <InputGroupInlineStart />
        </div>
        <div className="bg-muted/50 rounded-xl md:min-h-min">
          {isLoadingCustomer && !dataCustomer ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <DataTableCustomer
              data={dataCustomer?.data ?? []}
              columns={columnsCustomer()}
              pagination={pagination}
              pageCount={pageCount}
              onPaginationChange={onPaginationChange}
            />
          )}
        </div>
        <Toaster />
      </div>
    </>
  );
}
