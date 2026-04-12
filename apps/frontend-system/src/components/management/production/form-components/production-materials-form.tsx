import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription, FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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
import {
  CreateProductionSchemaInput,
  UpdateProductionSchemaInput,
} from "@repo/schemas";

interface ProductionMaterialsFormProps {
  control: Control<CreateProductionSchemaInput | UpdateProductionSchemaInput>;
  productionMaterial: FieldArrayWithId<
    CreateProductionSchemaInput | UpdateProductionSchemaInput,
    "materials"
  >[];
  appendMaterial: UseFieldArrayAppend<CreateProductionSchemaInput | UpdateProductionSchemaInput, "materials">;
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
    <Card className={"space-y-4"}>
      <CardContent>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Informasi Bahan baku</FieldLegend>
            <FieldDescription>
              Masukkan data penggunaan bahan baku yang digunakan dalam produksi
              produk
            </FieldDescription>
          </FieldSet>
          <FieldGroup>
            <Button type={"button"} onClick={() => addMaterial()}>
              Tambah Bahan Baku
            </Button>
            {productionMaterial?.map((item, index) => (
              <Card key={item.id}>
                <CardContent>
                  <FieldGroup>
                    <div className={"flex justify-between"}>
                      <FieldLabel>Material {index + 1}</FieldLabel>
                      <Button type={"button"} onClick={() => remove(index)}>
                        <Trash2 />
                      </Button>
                    </div>
                    <Controller
                      name={`materials.${index}.rawMaterialId`}
                      control={control}
                      render={({ field, formState: {errors} }) => (
                        <Field>
                          <FieldLabel>Bahan Baku</FieldLabel>
                          <Select
                            value={
                              field.value === 0
                                ? undefined
                                : field.value?.toString()
                            }
                            onValueChange={(val) => field.onChange(Number(val))}
                          >
                            <SelectTrigger>
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
                          <FieldError>{errors.materials?.[0]?.rawMaterialId?.message}</FieldError>
                        </Field>
                      )}
                    />
                    <Controller
                      name={`materials.${index}.quantityUsed`}
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel>Jumlah material digunakan</FieldLabel>
                          <Input
                            type={"number"}
                            onWheel={(e) =>
                              (e.target as HTMLInputElement).blur()
                            }
                            value={field.value?.toString()}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                          />
                        </Field>
                      )}
                    />
                  </FieldGroup>
                </CardContent>
              </Card>
            ))}
          </FieldGroup>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
