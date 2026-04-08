"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { ProductStatus, ProductVariant } from "@/common/types";
import {
  CreateProductSchemaInput,
  ProductSchema,
  ProductStatusEnum,
} from "@repo/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function generateCombinations(
  types: { name: string; values: { value: string }[] }[],
): Record<string, string>[] {
  if (!types || types.length === 0) return [];

  const validTypes = types.filter(
    (t) => t.name && t.values.some((v) => v.value),
  );
  if (validTypes.length === 0) return [];

  const result: Record<string, string>[] = [{}];
  for (const type of validTypes) {
    const validValues = type.values.filter((v) => v.value);
    if (validValues.length === 0) continue;
    const newResult: Record<string, string>[] = [];
    for (const existing of result) {
      for (const val of validValues) {
        newResult.push({ ...existing, [type.name]: val.value });
      }
    }
    if (newResult.length > 0) result.splice(0, result.length, ...newResult);
  }
  return result.filter((r) => Object.keys(r).length > 0);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VariantTypeFields({
  control,
  typeIndex,
  onRemove,
  errors,
}: {
  control: any;
  typeIndex: number;
  onRemove: () => void;
  errors: any;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variantsTypes.${typeIndex}.values`,
  });
  const [newValue, setNewValue] = useState("");

  const handleAddValue = () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    append({ value: trimmed });
    setNewValue("");
  };

  return (
    <Card className="border border-border bg-muted/30">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name={`variantsTypes.${typeIndex}.name`}
            render={({ field }) => (
              <div className="flex-1">
                <Input
                  placeholder="Nama tipe (cth: Warna, Ukuran)"
                  {...field}
                />
                {errors?.variantsTypes?.[typeIndex]?.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.variantsTypes[typeIndex].name.message}
                  </p>
                )}
              </div>
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>

        {/* Values */}
        <div className="flex flex-wrap gap-2">
          {fields.map((f, vi) => (
            <Controller
              key={f.id}
              control={control}
              name={`variantsTypes.${typeIndex}.values.${vi}.value`}
              render={({ field }) => (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {field.value}
                  <button
                    type="button"
                    className="ml-1 hover:text-destructive"
                    onClick={() => remove(vi)}
                  >
                    ×
                  </button>
                </Badge>
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Tambah nilai (cth: Merah)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), handleAddValue())
            }
          />
          <Button type="button" variant="outline" onClick={handleAddValue}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function ProductForm() {
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateProductSchemaInput>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      status: "ACTIVE",
      useVariant: false,
      isActive: true,
      variantsTypes: [],
      variants: [],
    },
  });

  const {
    fields: typeFields,
    append: appendType,
    remove: removeType,
  } = useFieldArray({ control, name: "variantsTypes" });

  const { fields: variantFields, replace: replaceVariants } = useFieldArray({
    control,
    name: "variants",
  });

  const useVariant = useWatch({ control, name: "useVariant" });

  const handleGenerateCombinations = () => {
    const types = getValues("variantsTypes") ?? [];
    const combinations = generateCombinations(types);
    const newVariants = combinations.map((opts) => {
      const skuParts = Object.values(opts)
        .map((v) => v.slice(0, 3).toUpperCase())
        .join("-");
      return { sku: skuParts, price: 0, cost: 0, options: opts };
    });
    replaceVariants(newVariants);
  };

  const onSubmit = (values: CreateProductSchemaInput) => {
    const payload = {
      ...values,
      variantsTypes: values.variantsTypes?.map((t) => ({
        name: t.name,
        values: t.values.map((v) => v.value),
      })),
    };
    console.log("Payload:", JSON.stringify(payload, null, 2));
    // TODO: call API
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-2xl mx-auto p-6"
    >
      <h1 className="text-2xl font-bold">Tambah Produk</h1>

      {/* ── Info Dasar ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Nama Produk
                </label>
                <Input
                  placeholder="Kaos Polos Premium"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    setValue("slug", generateSlug(e.target.value));
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Deskripsi
                </label>
                <Textarea
                  placeholder="Deskripsi produk..."
                  rows={3}
                  {...field}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Slug */}
          <Controller
            control={control}
            name="slug"
            render={({ field }) => (
              <div>
                <label className="text-sm font-medium mb-1 block">Slug</label>
                <Input placeholder="kaos-polos-premium" {...field} />
                {errors.slug && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.slug.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Status */}
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.status.message}
                  </p>
                )}
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* ── Variant Toggle ── */}
      <Card>
        <CardContent className="pt-6">
          <Controller
            control={control}
            name="useVariant"
            render={({ field }) => (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium">Gunakan Variant</p>
                  <p className="text-sm text-muted-foreground">
                    Aktifkan jika produk memiliki variasi (warna, ukuran, dll)
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* ── Variant Types ── */}
      {useVariant && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Tipe Variant</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendType({ name: "", values: [] })}
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah Tipe
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {typeFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada tipe variant. Klik "Tambah Tipe" untuk mulai.
                </p>
              )}
              {typeFields.map((f, i) => (
                <VariantTypeFields
                  key={f.id}
                  control={control}
                  typeIndex={i}
                  onRemove={() => removeType(i)}
                  errors={errors}
                />
              ))}
              {errors.variantsTypes?.root && (
                <p className="text-sm text-destructive">
                  {errors.variantsTypes.root.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── Generate Variants ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Daftar SKU</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate otomatis dari kombinasi tipe variant
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleGenerateCombinations}
              >
                Generate Kombinasi
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {variantFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Klik "Generate Kombinasi" setelah mengisi tipe variant.
                </p>
              )}
              {variantFields.map((f, i) => {
                const opts = getValues(`variants.${i}.options`);
                return (
                  <div
                    key={f.id}
                    className="border rounded-lg p-3 space-y-3 bg-muted/20"
                  >
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(opts ?? {}).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-xs">
                          {k}: {v}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {/* SKU */}
                      <Controller
                        control={control}
                        name={`variants.${i}.sku`}
                        render={({ field }) => (
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              SKU
                            </label>
                            <Input className="h-8 text-sm" {...field} />
                            {errors.variants?.[i]?.sku && (
                              <p className="text-xs text-destructive mt-1">
                                {errors.variants[i].sku.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                      {/* Price */}
                      <Controller
                        control={control}
                        name={`variants.${i}.price`}
                        render={({ field }) => (
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              Harga
                            </label>
                            <Input
                              type="number"
                              className="h-8 text-sm"
                              {...field}
                            />
                            {errors.variants?.[i]?.price && (
                              <p className="text-xs text-destructive mt-1">
                                {errors.variants[i].price.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                      {/* Cost */}
                      <Controller
                        control={control}
                        name={`variants.${i}.cost`}
                        render={({ field }) => (
                          <div>
                            <label className="text-xs font-medium mb-1 block">
                              Modal
                            </label>
                            <Input
                              type="number"
                              className="h-8 text-sm"
                              {...field}
                            />
                            {errors.variants?.[i]?.cost && (
                              <p className="text-xs text-destructive mt-1">
                                {errors.variants[i].cost.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                );
              })}
              {errors.variants?.root && (
                <p className="text-sm text-destructive">
                  {errors.variants.root.message}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Button type="submit" className="w-full">
        Simpan Produk
      </Button>
    </form>
  );
}
