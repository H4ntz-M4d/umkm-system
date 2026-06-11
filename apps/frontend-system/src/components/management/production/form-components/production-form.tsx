"use client";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Control, Controller, FormState } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { CreateProductionSchemaInput } from "@repo/schemas";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";

const status = [
  {
    id: "PLANNED",
    label: "Direncanakan",
    description: "Dalam tahap perencanaan untuk diproduksi",
  },
  {
    id: "IN_PROGRESS",
    label: "Berjalan",
    description: "Sedang dalam progress untuk diproduksi",
  },
];

interface ProductionFormProps {
  control: Control<CreateProductionSchemaInput>;
  formState: FormState<CreateProductionSchemaInput>;
}

export default function ProductionForm({
  control,
  formState,
}: ProductionFormProps) {
  const { fetchProductVariantList } = useProductsOperation({
    enabledProductVariantList: true,
  });
  const { errors } = formState;

  return (
    <FieldGroup className="mb-5">
      <Controller
        name={"producedVariantId"}
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Produk Variant</FieldLabel>
            <Select
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
            >
              <SelectTrigger className=" rounded-md">
                <SelectValue
                  placeholder={"Pilih produk yang ingin di produksi"}
                />
              </SelectTrigger>
              <SelectContent className={"py-2"}>
                {fetchProductVariantList?.data?.map((pm, index, array) => {
                  const isLast = index === array.length - 1;
                  return (
                    <div key={pm.id}>
                      <SelectGroup>
                        <SelectLabel>{pm.name}</SelectLabel>
                        {pm.variants.map((pv) => (
                          <SelectItem key={pv.id} value={pv.id}>
                            {pv.sku}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {isLast ? null : <SelectSeparator />}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            <FieldError>{errors.producedVariantId?.message}</FieldError>
          </Field>
        )}
      />
      <Field orientation={"horizontal"}>
        <Controller
          name={"quantityProduced"}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Jumlah diproduksi</FieldLabel>
              <Input
                type={"number"}
                className=""
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                {...field}
                value={field.value?.toString()}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
              <FieldError>{errors.quantityProduced?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          name={"status"}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Status Produksi</FieldLabel>
              <Select
                value={field.value?.toString()}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className=" rounded-md">
                  <SelectValue
                    placeholder={"Pilih produk yang ingin di produksi"}
                  />
                </SelectTrigger>
                <SelectContent className={"py-2"}>
                  {status.map((item, index) => {
                    return (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FieldError>{errors.status?.message}</FieldError>
            </Field>
          )}
        />
      </Field>
      <div className="grid grid-cols-2">
        <Controller
          control={control}
          name="targetDate"
          render={({ field }) => (
            <Field>
              <FieldLabel>Target Selesai</FieldLabel>
              <DatePickerSimple
                value={field.value as Date}
                onValueChange={(val) => field.onChange(val)}
              />
            </Field>
          )}
        />
      </div>
      <Controller
        name={"notes"}
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Catatan</FieldLabel>
            <Textarea
              {...field}
              placeholder="Masukkan catatan disini..."
              className="h-20"
            />
            <FieldError>{errors.notes?.message}</FieldError>
          </Field>
        )}
      />
    </FieldGroup>
  );
}
