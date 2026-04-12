import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductionForm from "@/components/management/production/form-components/production-form";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductionData,
  UpdateProductionSchema,
  UpdateProductionSchemaInput,
  z,
} from "@repo/schemas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductionMaterialsForm from "@/components/management/production/form-components/production-materials-form";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { Toaster } from "@/components/ui/sonner";

type ProductionDataById = z.infer<typeof ProductionData>;
interface FormProps {
  initalData?: ProductionDataById;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  id?: string;
}

export default function ProductionModalForm({
  initalData,
  open,
  setOpen,
  id,
}: FormProps) {
  const formValues = useMemo(() => {
    const data = initalData;
    if (!data) return undefined;
    return {
      storeId: Number(data.storeId),
      producedVariantId: Number(data.producedVariantId),
      status: data.status as
        | "PLANNED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED",
      quantityProduced: data.quantityProduced,
      materials:
        data.materials?.map((material) => ({
          rawMaterialId: Number(material.rawMaterialId),
          quantityUsed: material.quantityUsed,
        })) ?? [],
    };
  }, [initalData]);

  const { control, handleSubmit, formState, reset } =
    useForm<UpdateProductionSchemaInput>({
      resolver: zodResolver(UpdateProductionSchema),
      defaultValues: {
        storeId: 0,
        producedVariantId: 0,
        status: "PLANNED",
        quantityProduced: 0,
        materials: [
          {
            rawMaterialId: 0,
            quantityUsed: 0,
          },
        ],
      },
      values: formValues,
    });

  const {
    fields: productionMaterial,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "materials",
  });

  const { updateProductionData, isUpdating } = useProductionOperation({});
  const onSubmit = (data: UpdateProductionSchemaInput) => {
    if (!id) return;
    updateProductionData({ id, data });
    setOpen?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="py-4">
            <DialogTitle className="sm:text-lg">Edit Data</DialogTitle>
            <DialogDescription>
              Edit data produksi atau material produksi di sini. Jika telah
              selesai untuk di edit jangan lupa untuk di simpan
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue={"production"}>
            <TabsList>
              <TabsTrigger value={"production"}>Data Produksi</TabsTrigger>
              <TabsTrigger value={"production-material"}>
                Data Material
              </TabsTrigger>
            </TabsList>
            <TabsContent value={"production"}>
              <div className={"no-scrollbar max-h-[60vh] overflow-y-auto"}>
                <ProductionForm control={control} formState={formState} />
              </div>
            </TabsContent>
            <TabsContent value={"production-material"}>
              <div className={"no-scrollbar max-h-[60vh] overflow-y-auto"}>
                <ProductionMaterialsForm
                  control={control}
                  productionMaterial={productionMaterial}
                  appendMaterial={append}
                  remove={remove}
                />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button type={"button"}>Batal</Button>
            <Button type={"submit"} disabled={isUpdating}>
              {isUpdating ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
}
