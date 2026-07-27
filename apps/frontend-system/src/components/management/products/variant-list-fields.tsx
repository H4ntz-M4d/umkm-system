"use client";

import { Control, Controller, FieldErrors } from "react-hook-form";
import { CreateProductSchemaInput } from "@repo/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import ProductNumberField from "./product-number-field";

interface VariantListFieldsProps {
  control: Control<CreateProductSchemaInput>;
  errors: FieldErrors<CreateProductSchemaInput>;
  /** Isi field array `variants`; `options` dipakai untuk label kombinasinya. */
  variants: { id: string; options: Record<string, string> }[];
  /** Tipe variant, untuk menampilkan badge "Warna: Merah" di kepala kartu. */
  types: { id: string; name: string }[];
  onRemoveVariant: (index: number) => void;
}

/**
 * Daftar kartu variant hasil generate kombinasi: SKU, harga, dan biaya modal
 * per kombinasi.
 *
 * Gambar tidak ada di sini. Sejak refactor Image Group, foto digantung pada
 * kombinasi nilai visual, bukan pada tiap variant, dan diurus ProductImageFields.
 */
export default function VariantListFields({
  control,
  errors,
  variants,
  types,
  onRemoveVariant,
}: VariantListFieldsProps) {
  if (variants.length === 0) return null;

  return (
    <div>
      {variants.map((variant, i) => (
        <Card key={variant.id} className={"mb-5"}>
          <CardHeader>
            <CardTitle className={"flex justify-between"}>
              <div className={"flex gap-3"}>
                {types.map((type) => (
                  <Badge key={type.id}>
                    {type.name}: {variant.options[type.name]}
                  </Badge>
                ))}
              </div>
              <Button
                variant={"destructive"}
                type={"button"}
                onClick={() => onRemoveVariant(i)}
              >
                <Trash2 />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup className={"lg:flex-row items-center"}>
              <Controller
                name={`variants.${i}.sku`}
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>SKU</FieldLabel>
                    <Input {...field} />
                    <FieldError>
                      {errors.variants?.[i]?.sku?.message}
                    </FieldError>
                  </Field>
                )}
              />
              <ProductNumberField
                control={control}
                name={`variants.${i}.price`}
                label={"Harga"}
              />
              <ProductNumberField
                control={control}
                name={`variants.${i}.cost`}
                label={"Biaya Modal"}
              />
            </FieldGroup>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
