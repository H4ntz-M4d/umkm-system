"use client";

import { columnsEmployee } from "@/components/management/users/employee/column";
import { DataTableEmployee } from "@/components/management/users/employee/data-table";
import { InputGroupInlineStart } from "@/components/ui/search";
import { Toaster } from "@/components/ui/sonner";
import { useUsersOperation } from "@/hooks/management/users/use-users-operation";
import { usePaginationParams } from "@/hooks/use-paginations-params";

export default function EmployeeManagementView() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const { dataEmployee, isLoadingEmployee } = useUsersOperation(pagination);
  const pageCount = dataEmployee?.total
    ? Math.ceil(dataEmployee?.total / pagination.pageSize)
    : -1;

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
          <InputGroupInlineStart />
        </div>
        <div className="bg-muted/50 rounded-xl md:min-h-min">
          {isLoadingEmployee && !dataEmployee ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <DataTableEmployee
              data={dataEmployee?.data ?? []}
              columns={columnsEmployee()}
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
