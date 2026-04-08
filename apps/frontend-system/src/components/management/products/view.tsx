"use client";

import { columnsEmployee } from "@/components/management/users/employee/column";
import { DataTableEmployee } from "@/components/management/users/employee/data-table";
import { Button } from "@/components/ui/button";
import { InputGroupInlineStart } from "@/components/ui/search";
import { Toaster } from "@/components/ui/sonner";
import { useUsersOperation } from "@/hooks/management/users/use-users-operation";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import Link from "next/link";
import { useState } from "react";
import {DataTableProducts} from "@/components/management/products/data-table";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { columnsProducts } from "@/components/management/products/column";
import { deleteProduct } from "@/lib/queries/products/products.query";

export default function ProductManagementView() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const [search, setSearch] = useState("");
  const debounceSearch = useDebounce(search, 500);

  const { fetchProductData, isLoadingProduct, deleteProductData } =
    useProductsOperation({
      pagination,
      search: debounceSearch,
    });

  const deleteStaffData = (id: string) => {
    deleteProductData(id);
  }

  const pageCount = fetchProductData?.meta.total
    ? Math.ceil(fetchProductData?.meta.total / pagination.pageSize)
    : 1;

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
          <InputGroupInlineStart
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Link href={"/management/products/new"}>
            <Button>Add Product</Button>
          </Link>
        </div>
        <div className="bg-muted/50 rounded-xl md:min-h-min">
          {isLoadingProduct && !fetchProductData ? (
            <div className="p-8 text-center">Loading...</div>
          ) : (
            <DataTableProducts
              data={fetchProductData?.data ?? []}
              columns={columnsProducts(deleteStaffData)}
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
