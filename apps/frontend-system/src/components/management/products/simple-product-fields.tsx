"use client";

import { Control, Controller } from "react-hook-form";
import { CreateProductSchemaInput } from "@repo/schemas";
import { CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import ProductNumberField from "./product-number-field";

interface SimpleProductFieldsProps {
  control: Control<CreateProductSchemaInput>;
  /** Isi field array `variants`; `id` dipakai sebagai key React. */
  variants: { id: string }[];
}

/**
 * Detail produk tanpa variant: harga, biaya modal, dan SKU.
 *
 * Produk seperti ini tetap memiliki satu ProductVariant implisit di database,
 * jadi field-nya tetap menunjuk ke `variants.${i}`. Fotonya ditangani
 * ProductImageFields lewat grup level produk bersignature '[]'.
 */
export default function SimpleProductFields({
  control,
  variants,
}: SimpleProductFieldsProps) {
  return (
    <CardContent className={"py-2 px-5"}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Detail Product</FieldLegend>
          <FieldDescription>
            Lengkapi detail product anda di bawah ini
          </FieldDescription>

          {variants.map((variant, i) => (
            <div key={variant.id} className={"flex flex-col gap-3 px-8 mb-5"}>
              <div className={"flex gap-3"}>
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
              </div>

              <Controller
                control={control}
                name={`variants.${i}.sku`}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>SKU</FieldLabel>
                    <Input {...field} />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />
            </div>
          ))}
        </FieldSet>
      </FieldGroup>
    </CardContent>
  );
}
