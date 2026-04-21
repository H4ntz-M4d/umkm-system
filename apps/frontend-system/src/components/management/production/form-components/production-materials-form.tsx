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
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMaterialsOperations } from "@/hooks/management/raw-materials/use-materials-operation";
import { CreateProductionSchemaInput } from "@repo/schemas";

interface ProductionMaterialsFormProps {
  control: Control<CreateProductionSchemaInput>;
  productionMaterial: FieldArrayWithId<
    CreateProductionSchemaInput,
    "materials"
  >[];
  appendMaterial: UseFieldArrayAppend<CreateProductionSchemaInput, "materials">;
  remove: UseFieldArrayRemove;
}

export default function ProductionMaterialsForm({
  control,
  productionMaterial,
  appendMaterial,
  remove,
}: ProductionMaterialsFormProps) {
  const { dataRawMaterialList } = useMaterialsOperations({
    enabledRawMaterialList: true,
  });

  const addMaterial = () => {
    appendMaterial({
      rawMaterialId: 0,
      quantityUsed: 0,
    });
  };

  return (
    <FieldGroup className={"my-4 gap-2"}>
      <Field orientation={"horizontal"}>
        <FieldLabel>Bahan Baku</FieldLabel>
        <Button
          type={"button"}
          size={"sm"}
          className="bg-primary/15 text-primary"
          onClick={() => addMaterial()}
        >
          <Plus />
          <p>Tambah Bahan</p>
        </Button>
      </Field>
      {productionMaterial?.map((item, index) => (
        <FieldGroup key={item.id}>
          <Field orientation={"horizontal"}>
            <Controller
              name={`materials.${index}.rawMaterialId`}
              control={control}
              render={({ field, formState: { errors } }) => (
                <Field>
                  <Select
                    value={
                      field.value === 0 ? undefined : field.value?.toString()
                    }
                    onValueChange={(val) => field.onChange(Number(val))}
                  >
                    <SelectTrigger className="bg-card rounded-md">
                      <SelectValue placeholder={"Pilih Bahan baku"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {dataRawMaterialList?.data?.map((rm) => (
                          <SelectItem key={rm.id} value={rm.id}>
                            {rm.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError>
                    {errors.materials?.[0]?.rawMaterialId?.message}
                  </FieldError>
                </Field>
              )}
            />
            <Controller
              name={`materials.${index}.quantityUsed`}
              control={control}
              render={({ field }) => (
                <Field>
                  <Input
                    type={"number"}
                    className="bg-card"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={field.value?.toString()}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </Field>
              )}
            />
            <Button type={"button"} onClick={() => remove(index)}>
              <Trash2 />
            </Button>
          </Field>
        </FieldGroup>
      ))}
    </FieldGroup>
  );
}
