"use client";

import { Control, Controller } from "react-hook-form";
import { CreateProductSchemaInput } from "@repo/schemas";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ProductNumberFieldProps {
  control: Control<CreateProductSchemaInput>;
  name: `variants.${number}.price` | `variants.${number}.cost`;
  label: string;
}

/**
 * Input angka untuk harga dan biaya modal variant.
 *
 * Menyatukan tiga perilaku yang dulu disalin di empat tempat: input kosong
 * dibaca 0 (bukan NaN), scroll roda tidak diam-diam mengubah angka, dan nilai
 * number form ditampilkan sebagai string.
 */
export default function ProductNumberField({
  control,
  name,
  label,
}: ProductNumberFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Input
            type={"number"}
            value={field.value?.toString()}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
            onChange={(e) =>
              field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
            }
          />
          {fieldState.error && (
            <FieldError>{fieldState.error.message}</FieldError>
          )}
        </Field>
      )}
    />
  );
}
