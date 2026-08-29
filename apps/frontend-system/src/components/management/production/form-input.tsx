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
import { Controller, Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProductionSchemaInput,
  ProductionBeSpokeSchema,
  ProductionBeSpokeSchemaInput,
  ProductionType,
} from "@repo/schemas";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import BeSpokeForm from "./form-components/be-spoke-form";

interface FormProps {
  initalData?: ProductionBeSpokeSchemaInput;
  id?: string;
  onOpenChange?: (open: boolean) => void;
}
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
  storeId: "",
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

function formatFormValues(data: FormProps["initalData"]) {
  if (!data) return defaultValue;
  return {
    storeId: data.storeId,
    producedVariantId: data.producedVariantId,
    status: data.status as
      | "PLANNED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED",
    quantityProduced: data.quantityProduced,
    type: data.type as "RESTOCK" | "MADE_TO_ORDER" | "PRE_ORDER" | "BE_SPOKE",
    targetDate: new Date(data.targetDate),
    notes: data.notes,
    bespoke: {
      title: data.bespoke?.title ?? "",
      description: data.bespoke?.description ?? "",
      name: data.bespoke?.name ?? "",
      email: data.bespoke?.email ?? "",
      phone: data.bespoke?.phone ?? "",
      quotedPrice: Number(data.bespoke?.quotedPrice ?? 0),
    },
  };
}

export default function ProductionModalForm({
  initalData,
  id,
  onOpenChange,
}: FormProps) {
  const [open, setOpen] = useState<boolean>(false);
  const formValues = formatFormValues(initalData);

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
  };

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
          onSubmit={handleSubmit(onSubmit, (err) => console.log(err))}
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
                  {/* Label lama hanya "Nama Toko" tanpa keterangan, sehingga
                      artinya bergantung tebakan. Yang dimaksud adalah tujuan
                      hasil produksinya. */}
                  <FieldLabel>Produksi untuk toko</FieldLabel>
                  <p className="-mt-1 mb-1 text-xs text-muted-foreground">
                    Hasil produksi selalu masuk ke stok rumah produksi lebih
                    dulu. Bila tujuannya toko lain, kiriman ke sana dibuat
                    otomatis begitu produksi ditandai selesai.
                  </p>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue placeholder={"Pilih toko tujuan"} />
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
