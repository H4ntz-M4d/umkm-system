import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useExpenseCategoriesOperation } from "@/hooks/management/expense/use-expense-categories-operations";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ExpenseCategoryResponse,
  ExpenseCategorySchema,
  ExpenseCategorySchemaInput,
} from "@repo/schemas";
import { Check, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

interface ExpenseCategoriesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idData?: string;
  dataCategory?: ExpenseCategoryResponse;
}

const colorPalette = [
  { value: "#cc5933", name: "Terracotta" },
  { value: "#747a52", name: "Olive" },
  { value: "#ccaa66", name: "Gold" },
  { value: "#a16345", name: "Sienna" },
  { value: "#929d7b", name: "Sage" },
  { value: "#7d6b5d", name: "Taupe" },
  { value: "#5d7a6b", name: "Teal" },
  { value: "#8b7355", name: "Walnut" },
  { value: "#9e9794", name: "Stone" },
  { value: "#6b5b4f", name: "Espresso" },
  { value: "#4a6741", name: "Forest" },
  { value: "#8b6914", name: "Amber" },
];

export default function ExpenseCategoriesForm({
  open,
  onOpenChange,
  idData,
  dataCategory,
}: ExpenseCategoriesFormProps) {
  const initialData = useMemo(() => {
    if (!dataCategory) return undefined;
    return {
      name: dataCategory?.name ?? "",
      description: dataCategory?.description ?? "",
      color: dataCategory?.color ?? colorPalette[0].value,
      isActive: dataCategory?.isActive ?? false,
      isMaterialsCategory: dataCategory?.isMaterialsCategory ?? false,
    };
  }, [dataCategory]);

  const [selectedColor, setSelectedColor] = useState(colorPalette[0].value);
  const form = useForm<ExpenseCategorySchemaInput>({
    resolver: zodResolver(ExpenseCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      color: colorPalette[0].value,
      isActive: false,
      isMaterialsCategory: false,
    },
    values: initialData,
  });
  
  const { createExpenseCategoryData, updateExpenseCategoriesData } =
    useExpenseCategoriesOperation({});
    
  const onSubmitData = (data: ExpenseCategorySchemaInput) => {
    if (idData) {
      updateExpenseCategoriesData({ id: idData, data });
      onOpenChange(false);
    } else {
      createExpenseCategoryData(data);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (idData) {
      form.reset(initialData);
    } else {
      form.reset({});
    }
  }, [idData, initialData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card py-8 px-5">
        <form
          onSubmit={form.handleSubmit(onSubmitData, (error) =>
            console.log(error),
          )}
        >
          <DialogHeader>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                Tambah Kategori Pengeluaran
              </DialogTitle>
              <DialogDescription>
                Buat kategori baru untuk pengeluaran Anda.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto no-scrollbar my-5">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Nama Kategori</FieldLabel>
                      <Input
                        placeholder="Masukkan nama kategori"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Deskripsi (Opsional)</FieldLabel>
                      <Textarea
                        placeholder="Masukkan deskripsi"
                        className="h-8"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="color"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Warna Kategori</FieldLabel>
                      <div className="grid grid-cols-6 gap-2 justify-items-center">
                        {colorPalette.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setSelectedColor(color.value);
                              form.setValue("color", color.value);
                              field.onChange(color.value);
                            }}
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg transition-all hover:scale-110",
                              selectedColor === color.value &&
                                "ring-2 ring-ring ring-offset-2 ring-offset-card",
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {selectedColor === color.value && (
                              <Check className="h-5 w-5 text-white drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}
                />

                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <FieldGroup>
                      <FieldLabel>
                        <Field orientation={"horizontal"}>
                          <FieldContent className="gap-0">
                            <FieldTitle className="font-medium text-lg">
                              Aktif Status
                            </FieldTitle>
                            <FieldDescription>
                              Kategori akan ada dan dapat di gunakan untuk
                              catatan pengeluaran
                            </FieldDescription>
                          </FieldContent>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(val) => field.onChange(val)}
                          />
                        </Field>
                      </FieldLabel>
                    </FieldGroup>
                  )}
                />

                <Controller
                  name="isMaterialsCategory"
                  control={form.control}
                  render={({ field }) => (
                    <FieldGroup>
                      <FieldLabel className="has-data-[state=checked]:bg-accent has-data-[state=checked]:border-accent-foreground">
                        <Field orientation={"horizontal"}>
                          <div className="bg-accent text-accent-foreground size-10 flex justify-center items-center rounded-md">
                            <Package />
                          </div>
                          <FieldContent className="gap-0">
                            <FieldTitle className="font-medium text-lg">
                              Hubungkan ke Bahan Baku
                            </FieldTitle>
                            <FieldDescription>
                              Aktifkan switch ini untuk membiarkan kategori ini
                              memperbarui stok dari bahan baku secara otomatis
                            </FieldDescription>
                          </FieldContent>
                          <Switch
                            className="data-checked:bg-accent-foreground"
                            checked={field.value}
                            onCheckedChange={(val) => field.onChange(val)}
                          />
                        </Field>
                      </FieldLabel>
                    </FieldGroup>
                  )}
                />
              </FieldGroup>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </div>
          </DialogHeader>
        </form>
      </DialogContent>
    </Dialog>
  );
}
