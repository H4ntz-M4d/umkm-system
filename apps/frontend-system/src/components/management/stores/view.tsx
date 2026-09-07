"use client";

import { InputGroupInlineStart } from "@/components/ui/search";
import { DataTableStore } from "@/components/management/stores/data-table";
import { columnsStore } from "@/components/management/stores/columns";
import StoreForm from "@/components/management/stores/store-form";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useState } from "react";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { Toaster } from "sonner";
import { StoreData } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import AlertDeleteStore from "./alert-delete-store";

export default function View() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const [idData, setIdData] = useState<string | undefined>();
  const { data, isLoading, createData, updateData, deleteData } =
    useStoreOperations({ pagination });
  const [openForm, setOpenForm] = useState(false);
  const [openAlertDelete, setOpenAlertDelete] = useState(false);

  const handleCreate = () => {
    setIdData(undefined);
    setOpenForm(true);
  };
  const handleUpdate = (id: string) => {
    setIdData(id);
    setOpenForm(true);
  };
  const handleDelete = (id: string) => {
    setIdData(id);
    setOpenAlertDelete(true);
  };

  const columnActions = columnsStore({
    onEdit: handleUpdate,
    onDelete: handleDelete,
  });

  const pageCount = data?.total
    ? Math.ceil(data.total / pagination.pageSize)
    : -1;

  const handleRemove = () => {
    if (idData) {
      deleteData(idData);
    }
  };

  const selectedStore = data?.data.find(
    (item: StoreData) => item.id === idData,
  );
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
          <InputGroupInlineStart />
          <Button className="w-30" onClick={handleCreate}>
            Add Store
          </Button>
        </div>
        <div className="bg-muted/50 rounded-xl md:min-h-min">
          {isLoading && !data ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <DataTableStore
              data={data?.data ?? []}
              columns={columnActions}
              pagination={pagination}
              pageCount={pageCount}
              onPaginationChange={onPaginationChange}
            />
          )}
        </div>
        <StoreForm
          initialData={selectedStore}
          onSubmit={(formData, onSaved) => {
            if (idData) {
              updateData({ id: idData, data: formData }, { onSuccess: onSaved });
            } else {
              createData(formData, { onSuccess: onSaved });
            }
          }}
          isOpen={openForm}
          onOpenChange={setOpenForm}
        />
        <AlertDeleteStore
          open={openAlertDelete}
          onOpenChange={setOpenAlertDelete}
          onConfirm={handleRemove}
        />
        <Toaster />
      </div>
    </>
  );
}
