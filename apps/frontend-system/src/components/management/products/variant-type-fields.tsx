"use client";

import { useState } from "react";
import { Control, Controller } from "react-hook-form";
import { CreateProductSchemaInput } from "@repo/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, XIcon } from "lucide-react";

/** Satu tipe variant beserta nilainya, mis. Warna: [Merah, Biru]. */
export interface VariantTypeItem {
  name: string;
  values: string[];
  isHaveVisual?: boolean;
}

interface VariantTypeFieldsProps {
  control: Control<CreateProductSchemaInput>;
  /** Isi field array `variantsTypes`; `id` dipakai sebagai key React. */
  types: (VariantTypeItem & { id: string })[];
  onAppendType: (type: VariantTypeItem) => void;
  onRemoveType: (index: number) => void;
  onUpdateType: (index: number, type: VariantTypeItem) => void;
}

/**
 * Pengelolaan tipe variant: menambah tipe (Warna, Ukuran), menambah dan
 * menghapus nilainya, serta menandai tipe mana yang punya foto berbeda.
 *
 * Input teks tipe dan nilai adalah state UI murni, jadi disimpan di sini alih-alih
 * di form induk.
 */
export default function VariantTypeFields({
  control,
  types,
  onAppendType,
  onRemoveType,
  onUpdateType,
}: VariantTypeFieldsProps) {
  const [typeInput, setTypeInput] = useState("");
  const [valueInputs, setValueInputs] = useState<Record<number, string>>({});

  const addType = () => {
    if (!typeInput.trim()) return;
    onAppendType({ name: typeInput.trim(), values: [], isHaveVisual: false });
    setTypeInput("");
  };

  const addValue = (index: number, type: VariantTypeItem) => {
    const value = valueInputs[index]?.trim();
    if (!value) return;
    onUpdateType(index, { ...type, values: [...type.values, value] });
    setValueInputs((prev) => ({ ...prev, [index]: "" }));
  };

  const removeValue = (index: number, type: VariantTypeItem, valueIndex: number) =>
    onUpdateType(index, {
      ...type,
      values: type.values.filter((_, i) => i !== valueIndex),
    });

  return (
    <FieldGroup>
      <Controller
        name={"variantsTypes"}
        control={control}
        render={() => (
          <Field orientation={"horizontal"}>
            <Input
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              placeholder={"e.g. Warna, Ukuran"}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addType())
              }
            />
            <Button type={"button"} onClick={addType}>
              Tambah Tipe Variant
            </Button>
          </Field>
        )}
      />

      {types.map((type, i) => (
        <Card key={type.id}>
          <CardContent>
            <div className={"flex justify-between items-center"}>
              <span className={"font-semibold"}>{type.name}</span>
              <div className={"flex items-center gap-4"}>
                <div className={"flex items-center gap-2"}>
                  <Switch
                    checked={type.isHaveVisual ?? false}
                    onCheckedChange={(checked) =>
                      onUpdateType(i, { ...type, isHaveVisual: checked })
                    }
                  />
                  <span className={"text-xs text-secondary"}>
                    Punya foto berbeda
                  </span>
                </div>
                <Button
                  variant={"destructive"}
                  type={"button"}
                  onClick={() => onRemoveType(i)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>

            <FieldDescription className={"text-xs text-secondary mt-1"}>
              Aktifkan untuk tipe yang mengubah tampilan produk seperti Warna
              atau Motif. Biarkan mati untuk Ukuran, karena ukuran tidak
              mengubah gambar.
            </FieldDescription>

            <div className={"flex flex-wrap gap-3 my-3"}>
              {type.values.map((value, vi) => (
                <Badge key={vi}>
                  {value}
                  <Button
                    type={"button"}
                    size={"xs"}
                    className={"hover:text-destructive"}
                    onClick={() => removeValue(i, type, vi)}
                  >
                    <XIcon />
                  </Button>
                </Badge>
              ))}
            </div>

            <FieldGroup>
              <Field orientation={"horizontal"}>
                <Input
                  placeholder={"e.g. Merah, Katun"}
                  value={valueInputs[i] ?? ""}
                  onChange={(e) =>
                    setValueInputs((prev) => ({ ...prev, [i]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValue(i, type);
                    }
                  }}
                />
                <Button type={"button"} onClick={() => addValue(i, type)}>
                  Tambah Variant
                </Button>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ))}
    </FieldGroup>
  );
}
