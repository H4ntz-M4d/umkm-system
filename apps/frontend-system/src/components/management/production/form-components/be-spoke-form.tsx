import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateProductionSchemaInput } from "@repo/schemas";
import { Control, Controller, FormState } from "react-hook-form";

interface ProductionFormProps {
  control: Control<CreateProductionSchemaInput>;
  formState: FormState<CreateProductionSchemaInput>;
}

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

export default function BeSpokeForm({
  control,
  formState,
}: ProductionFormProps) {
  const { errors } = formState;
  return (
    <FieldGroup className="mb-5">
      <Field>
        <Controller 
        control={control}
        name="bespoke.title"
        render={({field}) => (
          <Field>
            <FieldLabel>Title</FieldLabel>
            <Input placeholder="e.g. Totebag Nia Batik" {...field} />
          </Field>
        )}
        />
      </Field>
      <Field>
        <Controller 
        control={control}
        name="bespoke.description"
        render={({field}) => (
          <Field>
            <FieldLabel>Deskripsi</FieldLabel>
            <Textarea className="h-20" placeholder="Bahan baku, ukuran, spesial untuk..." {...field} />
          </Field>
        )}
        />
      </Field>
      <Field orientation={"horizontal"}>
        <Controller
          control={control}
          name="bespoke.email"
          render={({ field }) => (
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input className="rounded-md" {...field} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="bespoke.name"
          render={({ field }) => (
            <Field>
              <FieldLabel>Nama</FieldLabel>
              <Input className="rounded-md" {...field} />
            </Field>
          )}
        />
      </Field>
      <Field orientation={"horizontal"}>
        <Controller
          control={control}
          name="bespoke.phone"
          render={({ field }) => (
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input type="text" className="rounded-md" {...field} />
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
          control={control}
          name="bespoke.quotedPrice"
          render={({ field }) => (
            <Field>
              <FieldLabel>Harga Usulan</FieldLabel>
              <Input
                type="number"
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                className="rounded-md"
                value={field.value?.toString()}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
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
