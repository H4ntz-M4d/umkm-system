"use client";

import { InputGroupInlineStart } from "@/components/ui/search";
import { DataTableStore } from "./data-table";
import { columnsStore } from "./columns";
import { useQueryClient } from "@tanstack/react-query";
import StoreForm from "@/components/management/stores/store-form";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useState } from "react";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { Toaster } from "sonner";

export default function StoreView() {
  const qc = useQueryClient();
  const { pagination, onPaginationChange } = usePaginationParams();
  const [idData, setIdData] = useState<string | undefined>();
  const { data, isLoading, createData, updateData, deleteData } =
    useStoreOperations(pagination);

  const pageCount = data?.total
    ? Math.ceil(data.total / pagination.pageSize)
    : -1;

  const handleRemove = (id: string) => {
    if (confirm("Apakah anda yakin ingin menghapusnya?")) {
      deleteData(id);
    }
  };

  const selectedStore = data?.data.find((item: any) => item.id === idData);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
          <InputGroupInlineStart />
          <StoreForm
            initialData={selectedStore}
            onSubmit={(formData) => {
              if (idData) {
                updateData({ id: idData, data: formData });
              } else {
                createData(formData);
              }
            }}
            onOpenChange={(open) => !open && setIdData(undefined)}
          />
        </div>
        <div className="bg-muted/50 rounded-xl md:min-h-min">
          {isLoading && !data ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <DataTableStore
              data={data?.data ?? []}
              columns={columnsStore(setIdData, handleRemove)}
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
