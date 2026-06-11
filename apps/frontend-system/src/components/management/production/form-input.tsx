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
import {
  Controller,
  Resolver,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProductionSchemaInput,
  ProductionBeSpokeSchema,
  ProductionBeSpokeSchemaInput,
  ProductionData,
  ProductionSchema,
  ProductionType,
  z,
} from "@repo/schemas";
import ProductionMaterialsForm from "@/components/management/production/form-components/production-materials-form";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { Toaster } from "@/components/ui/sonner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { Label } from "@/components/ui/label";
import { type } from "os";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import BeSpokeForm from "./form-components/be-spoke-form";

type ProductionDataById = z.infer<typeof ProductionData>;
interface FormProps {
  initalData?: ProductionBeSpokeSchemaInput;
  id?: string;
  onOpenChange?: (open: boolean) => void;
}

type ProductionTypeEnum = z.infer<typeof ProductionType>;
const options = ProductionType.options;
const typeOptions = options.map((item) => {
  return {
    value: item,
    name: item
      .replaceAll("_", " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  };
});

const defaultValue: ProductionBeSpokeSchemaInput = {
  storeId: 0,
  producedVariantId: "",
  status: "PLANNED",
  quantityProduced: 0,
  type: "RESTOCK",
  targetDate: new Date(),
  notes: "",
  bespoke: {
    title: "",
    description: "",
    name: "",
    email: "",
    phone: "",
    quotedPrice: 0,
  },
};

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
      producedVariantId: data.producedVariantId,
      status: data.status as
        | "PLANNED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED",
      quantityProduced: data.quantityProduced,
      type: data.type as "RESTOCK" | "MADE_TO_ORDER" | "PRE_ORDER" | "BE_SPOKE",
      targetDate: new Date(),
      notes: data.notes,
      bespoke: {
        title: data.bespoke?.title ?? "",
        description: data.bespoke?.description ?? "",
        name: data.bespoke?.name ?? "",
        email: data.bespoke?.email ?? "",
        phone: data.bespoke?.phone ?? "",
        quotedPrice: Number(data.bespoke?.quotedPrice) ?? 0,
      },
    };
  }, [initalData]);

  const { control, handleSubmit, formState, reset, setValue } =
    useForm<ProductionBeSpokeSchemaInput>({
      resolver: zodResolver(
        ProductionBeSpokeSchema,
      ) as Resolver<ProductionBeSpokeSchemaInput>,
      defaultValues: defaultValue,
      values: formValues,
    });

  const sourceType = useWatch({
    name: "type",
    control: control,
  });

  const isOpen = open || !!initalData;
  const handleOpenDialog = (val: boolean) => {
    setOpen(val);
    onOpenChange?.(val);
    if (!val) reset(defaultValue);
  };

  useEffect(() => {
    if (initalData) {
      reset(formValues);
    } else {
      reset(defaultValue);
    }
  }, [initalData, reset, formValues]);

  const { updateProductionData, isUpdating, createProductionData, isCreating } =
    useProductionOperation({});

  const { storeList } = useStoreOperations({ enableStoreList: true });

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
      <DialogContent className="sm:max-w-2xl bg-primary-foreground max-h-[90vh] overflow-hidden flex flex-col p-0">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden p-4"
        >
          <DialogHeader className="py-4">
            <DialogTitle className="sm:text-lg">Edit Data</DialogTitle>
            <DialogDescription>
              Edit data produksi atau material produksi di sini. Jika telah
              selesai untuk di edit jangan lupa untuk di simpan
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="overflow-y-auto no-scrollbar">
            <FieldGroup className="mb-5">
              <Controller
                name={"type"}
                control={control}
                render={({ field }) => (
                  <Field>
                    <Label>Source type *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {typeOptions.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => {
                            setValue("type", s.value);
                            field.onChange(s.value);
                          }}
                          className={`rounded-xl border p-3 text-left transition-all ${sourceType === s.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card hover:bg-accent/30"}`}
                        >
                          <Badge className="mb-1.5 bg-secondary/10 text-secondary border border-secondary">
                            {s.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {s.value === "RESTOCK" && "Internal refill"}
                            {s.value === "MADE_TO_ORDER" && "Customer order"}
                            {s.value === "BE_SPOKE" && "Fully custom"}
                            {s.value === "PRE_ORDER" && "Batch drop"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </Field>
                )}
              />
            </FieldGroup>

            <Controller
              name={"storeId"}
              control={control}
              render={({ field }) => (
                <Field className="mb-5">
                  <FieldLabel>Nama Toko</FieldLabel>
                  <Select
                    value={
                      field.value === 0 ? undefined : field.value?.toString()
                    }
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder={"Pilih Toko"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {storeList?.data?.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>{formState.errors.storeId?.message}</FieldError>
                </Field>
              )}
            />

            {sourceType !== "BE_SPOKE" ? (
              <ProductionForm control={control} formState={formState} />
            ) : (
              <BeSpokeForm control={control} formState={formState} />
            )}
          </ScrollArea>

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
