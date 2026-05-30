"use client";

import { columnsCategories } from "@/components/management/categories/categories-column";
import { DataTableCategories } from "@/components/management/categories/categories-datatable";
import CategoriesForm from "@/components/management/categories/categories-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Toaster } from "@/components/ui/sonner";
import { useCategoriesOperation } from "@/hooks/management/categories/use-categories-operation";
import { useDebounce } from "@/hooks/use-debounce";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Page() {
  const [idData, setIdData] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 500);

  const { getCategoriesData, removeCategoriesData, getCategoriesSummaryData } =
    useCategoriesOperation({
      search: debouncedSearch,
      enableGetCategories: true,
    });
  const summaryData = getCategoriesSummaryData?.data;

  const deleteById = (id: string) => {
    removeCategoriesData({ id: id });
  };

  const selectedData = getCategoriesData?.data?.find(
    (item) => item.id === idData,
  );

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 px-6">
      {/* Header Content */}
      <div className="flex flex-col md:flex-row gap-5 md:justify-between md:items-center my-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-3xl lg:text-4xl">Kategori Produk</h2>
          <p className="text-sm text-muted-foreground">
            Kelola kategori produk anda
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 xl:min-w-150">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari kategori"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Button
            onClick={() => {
              setIsOpen(true);
              setIdData("");
            }}
          >
            <Plus />
            Tambah kategori
          </Button>
        </div>
      </div>

      {/* Summary Content */}
      <div className="grid md:grid-cols-3 gap-5 mb-5">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-xl">Total Kategori</h2>
            <h1 className="text-3xl">{summaryData?.totalCategories ?? 0}</h1>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-xl">Kategori Aktif</h2>
            <h1 className="text-3xl">{summaryData?.activeCategories ?? 0}</h1>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-xl">Terhubung ke Produk</h2>
            <h1 className="text-3xl">{summaryData?.linkedProducts ?? 0}</h1>
          </CardContent>
        </Card>
      </div>

      {/* Table Content */}
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTableCategories
          columns={columnsCategories(deleteById, setIdData, setIsOpen)}
          data={getCategoriesData?.data ?? []}
        />
      </div>

      <CategoriesForm
        idData={idData}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        initialValues={selectedData}
      />

      <Toaster />
    </div>
  );
}
