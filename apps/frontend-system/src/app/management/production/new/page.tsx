"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProductionSchemaInput,
  ProductionSchema,
} from "@repo/schemas";
import { Toaster } from "@/components/ui/sonner";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import ProductionForm from "@/components/management/production/form-components/production-form";
import ProductionMaterialsForm from "@/components/management/production/form-components/production-materials-form";

export default function Page() {
  const { createProductionData, isCreating } = useProductionOperation({});
  const { control, handleSubmit, formState } = useForm<
    CreateProductionSchemaInput
  >({
    resolver: zodResolver(ProductionSchema),
    defaultValues: {
      storeId: 0,
      producedVariantId: 0,
      quantityProduced: 0,
      status: "PLANNED",
      materials: [
        {
          rawMaterialId: 0,
          quantityUsed: 0,
        },
      ],
    },
  });

  const {
    fields: productionMaterial,
    append: appendMaterial,
    remove,
  } = useFieldArray({
    control,
    name: "materials",
  });

  const onSubmit = (
    data: CreateProductionSchemaInput,
  ) => {
    createProductionData(data as CreateProductionSchemaInput);
  };

  return (
    <div className={"flex flex-1 flex-col gap-4 p-4 mb-20"}>
      <div className={"flex items-center gap-3 my-3"}>
        <Button variant={"ghost"}>
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className={"text-2xl font-light font-display"}>
            Tambah Product Baru
          </h1>
          <p className={"text-secondary text-sm"}>
            Formulir untuk mengisi data dari product baru. Silahkan isi formulir
            berikut dengan data yang benar
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={"grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6"}>
          <section className={"space-y-6"}>
            <Card className={"space-y-5"}>
              <CardContent>
                <FieldGroup>
                  <FieldSet>
                    <FieldLegend
                      className={"font-display data-[variant=legend]:text-xl"}
                    >
                      Informasi Produksi
                    </FieldLegend>
                    <FieldDescription>
                      Masukkan data produk yang ingin di produksi
                    </FieldDescription>
                    <ProductionForm control={control} formState={formState} />
                  </FieldSet>
                </FieldGroup>
              </CardContent>
            </Card>
          </section>
          <section className={"space-y-6"}>
            <ProductionMaterialsForm
              control={control}
              productionMaterial={productionMaterial}
              appendMaterial={appendMaterial}
              remove={remove}
            />
            <div className={"space-y-4 flex gap-2 "}>
              <Button type={"button"} variant={"outline"}>
                Batal
              </Button>
              <Button type={"submit"} disabled={isCreating}>
                {isCreating ? "Menyimpan" : "Simpan"}
              </Button>
            </div>
          </section>
        </div>
      </form>
      <Toaster />
    </div>
  );
}
