"use client";

import { Control, Controller, FieldErrors } from "react-hook-form";
import { CreateProductSchemaInput, ProductTypeEnum } from "@repo/schemas";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductInfoFieldsProps {
  control: Control<CreateProductSchemaInput>;
  errors: FieldErrors<CreateProductSchemaInput>;
  categories: { id: string; name: string }[] | undefined;
  /**
   * Dipanggil setelah nilai form diperbarui. Induk yang mengurus dampaknya ke
   * field array variant, karena hanya dia yang memegang instance-nya.
   */
  onUseVariantChange: (useVariant: boolean) => void;
}

/** Identitas produk: nama, deskripsi, kategori, tipe, dan pemakaian variant. */
export default function ProductInfoFields({
  control,
  errors,
  categories,
  onUseVariantChange,
}: ProductInfoFieldsProps) {
  return (
    <Card className={"shadow-sm bg-primary-foreground space-y-5"}>
      <CardContent className={"py-2 px-5"}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend
              className={"font-display data-[variant=legend]:text-xl"}
            >
              Informasi Product
            </FieldLegend>
            <FieldDescription>
              Pastikan tidak ada nama produk yang sama saat menambahkan produk
              atau mengedit produk
            </FieldDescription>

            <FieldGroup>
              <Controller
                control={control}
                name={"name"}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className={"text-sm text-secondary"}>
                      NAMA PRODUCT
                    </FieldLabel>
                    <Input placeholder={"e.g. Syal Katun Lembut"} {...field} />
                    <FieldError>{errors.name?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name={"description"}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className={"text-sm text-secondary"}>
                      DESKRIPSI
                    </FieldLabel>
                    <Textarea
                      className={"min-h-30"}
                      placeholder={"Tambahkan deskripsi dari product ini"}
                      {...field}
                    />
                    <FieldError>{errors.description?.message}</FieldError>
                  </Field>
                )}
              />

              <FieldGroup>
                <Field orientation={"horizontal"}>
                  <Controller
                    name={"categoryId"}
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>KATEGORI</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={"Pilih Kategori"} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />

                  <Controller
                    name={"type"}
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <Field>TIPE PRODUK</Field>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={"Pilih Tipe"} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem
                              value={ProductTypeEnum.enum["READY_STOCK"]}
                            >
                              Siap di Jual
                            </SelectItem>
                            <SelectItem
                              value={ProductTypeEnum.enum["MADE_TO_ORDER"]}
                            >
                              Made to Order
                            </SelectItem>
                            <SelectItem
                              value={ProductTypeEnum.enum["PRE_ORDER"]}
                            >
                              Pre Order
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                  />
                </Field>
              </FieldGroup>

              <Controller
                control={control}
                name={"useVariant"}
                render={({ field }) => (
                  <Field orientation={"horizontal"}>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        onUseVariantChange(checked);
                      }}
                    />
                    <FieldLabel>Menggunakan Variant</FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
