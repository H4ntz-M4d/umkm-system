import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductionForm from "@/components/management/production/form-components/production-form";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProductionSchemaInput,
  ProductionData,
  ProductionSchema,
  z,
} from "@repo/schemas";
import ProductionMaterialsForm from "@/components/management/production/form-components/production-materials-form";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { Toaster } from "@/components/ui/sonner";

type ProductionDataById = z.infer<typeof ProductionData>;
interface FormProps {
  initalData?: ProductionDataById;
  id?: string;
  onOpenChange?: (open: boolean) => void;
}

export default function ProductionModalForm({
  initalData,
  id,
  onOpenChange,
}: FormProps) {
  const [open, setOpen] = useState<boolean>(false);
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
    useForm<CreateProductionSchemaInput>({
      resolver: zodResolver(ProductionSchema),
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

  const isOpen = open || !!initalData;
  const handleOpenDialog = (val: boolean) => {
    setOpen(val);
    onOpenChange?.(val);
    if (!val)
      reset({
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
      });
  };

  useEffect(() => {
    if (initalData) {
      reset(formValues);
    } else {
      reset({
        storeId: 0,
        producedVariantId: 0,
        status: "PLANNED",
        quantityProduced: 0,
        materials: [{ rawMaterialId: 0, quantityUsed: 0 }],
      });
    }
  }, [initalData, reset, formValues]);

  const { updateProductionData, isUpdating, createProductionData, isCreating } =
    useProductionOperation({});

  const isSubmitting = isUpdating || isCreating;
  const onSubmit = (data: CreateProductionSchemaInput) => {
    if (id) {
      updateProductionData({ id, data });
    } else {
      createProductionData(data);
    }
    handleOpenDialog(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenDialog}>
      <DialogTrigger asChild>
        <Button className="w-30">Buat Produksi</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-primary-foreground">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="py-4">
            <DialogTitle className="sm:text-lg">Edit Data</DialogTitle>
            <DialogDescription>
              Edit data produksi atau material produksi di sini. Jika telah
              selesai untuk di edit jangan lupa untuk di simpan
            </DialogDescription>
          </DialogHeader>
          <ProductionForm control={control} formState={formState} />

          <ProductionMaterialsForm
            control={control}
            productionMaterial={productionMaterial}
            appendMaterial={append}
            remove={remove}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type={"button"} variant={"outline"}>
                Batal
              </Button>
            </DialogClose>
            <Button type={"submit"} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
