"use client";

import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  CreateProductionSchemaInput,
  ProductionDetailDataType,
  ProductionSchema,
} from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";

interface BatchFormProps {
  /// Diisi saat dipakai untuk mengubah batch yang sudah ada.
  initialData?: ProductionDetailDataType | null;
}

const emptyValues: CreateProductionSchemaInput = {
  targetDate: new Date(),
  notes: "",
  items: [{ productVariantId: "", targetQuantity: 0 }],
};

export default function BatchForm({ initialData }: BatchFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const { fetchProductVariantList } = useProductsOperation({
    enabledProductVariantList: true,
  });
  const { createProductionData, updateProductionData, isCreating, isUpdating } =
    useProductionOperation({});

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductionSchemaInput>({
    resolver: zodResolver(ProductionSchema),
    defaultValues: initialData
      ? {
          targetDate: new Date(initialData.targetDate),
          notes: initialData.notes ?? "",
          items: initialData.items.map((item) => ({
            productVariantId: item.productVariantId,
            targetQuantity: item.targetQuantity,
          })),
        }
      : emptyValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = useWatch({ control, name: "items" });

  /// Satu baris per varian, bisa dicari lewat nama produk maupun SKU —
  /// daftar bertingkat memaksa admin menebak SKU mana milik produk mana.
  const variantItems: ComboboxItem[] = (
    fetchProductVariantList?.data ?? []
  ).flatMap((product) =>
    product.variants.map((variant) => ({
      value: variant.id,
      label: product.name,
      description: [variant.optionLabel, variant.sku]
        .filter(Boolean)
        .join(" · "),
      badge:
        product.status === "DRAFT"
          ? "Draft"
          : product.status === "NONACTIVE"
            ? "Produk nonaktif"
            : !variant.isActive
              ? "Varian nonaktif"
              : undefined,
      keywords: [product.name, variant.sku, variant.optionLabel],
    })),
  );

  const totalTarget = (items ?? []).reduce(
    (total, item) => total + (Number(item?.targetQuantity) || 0),
    0,
  );

  const submit = async (data: CreateProductionSchemaInput) => {
    try {
      if (initialData) {
        await updateProductionData({ id: initialData.id, data });
        router.push(`/management/production/${initialData.id}`);
      } else {
        const created = await createProductionData(data);
        router.push(`/management/production/${created.data.id}`);
      }
    } catch {
      // Toast galatnya sudah ditampilkan mutation; halaman dibiarkan terbuka
      // supaya isian admin tidak hilang.
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <Controller
          name="targetDate"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Target Selesai</FieldLabel>
              <DatePickerSimple
                value={field.value as Date}
                onValueChange={(value) => field.onChange(value)}
              />
              <FieldError>{errors.targetDate?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Catatan (opsional)</FieldLabel>
              <Textarea
                className="h-20"
                placeholder="Misalnya: gabungan pesanan bulan ini, dikerjakan di rumah produksi Bantul..."
                {...field}
              />
            </Field>
          )}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Varian yang Diproduksi</p>
            <p className="text-xs text-muted-foreground">
              Satu batch boleh memuat banyak varian. Hasilnya dicatat bertahap
              setiap kali toko produksi mengantar.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {fields.length} varian · {totalTarget} pcs
          </p>
        </div>

        <div className="space-y-3">
          {fields.map((row, index) => (
            <div
              key={row.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
            >
              <Controller
                name={`items.${index}.productVariantId`}
                control={control}
                render={({ field }) => (
                  <Field className="flex-1">
                    <FieldLabel className="sm:sr-only">Varian</FieldLabel>
                    <Combobox
                      items={variantItems}
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      placeholder="Pilih produk yang ingin diproduksi"
                      searchPlaceholder="Cari nama produk atau SKU..."
                      emptyMessage="Tidak ada produk atau SKU yang cocok"
                    />
                    <FieldError>
                      {errors.items?.[index]?.productVariantId?.message}
                    </FieldError>
                  </Field>
                )}
              />

              <Controller
                name={`items.${index}.targetQuantity`}
                control={control}
                render={({ field }) => (
                  <Field className="sm:w-40">
                    <FieldLabel className="sm:sr-only">Jumlah</FieldLabel>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Jumlah (pcs)"
                      {...field}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                    <FieldError>
                      {errors.items?.[index]?.targetQuantity?.message}
                    </FieldError>
                  </Field>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus varian ini"
                /// Baris terakhir tidak bisa dihapus: batch tanpa varian
                /// tidak berarti apa-apa, dan server pun menolaknya.
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                className="text-muted-foreground hover:text-destructive sm:mt-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Galat daftar (mis. varian ganda) tidak menempel ke satu baris,
            jadi ditampilkan di bawah daftarnya. */}
        {errors.items?.root?.message && (
          <p className="mt-3 text-sm text-destructive">
            {errors.items.root.message}
          </p>
        )}
        {typeof errors.items?.message === "string" && (
          <p className="mt-3 text-sm text-destructive">
            {errors.items.message}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => append({ productVariantId: "", targetQuantity: 0 })}
        >
          <Plus className="h-4 w-4" />
          Tambah Varian
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/management/production")}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? "Menyimpan..."
            : isEditing
              ? "Simpan Perubahan"
              : "Simpan Batch"}
        </Button>
      </div>
    </form>
  );
}
