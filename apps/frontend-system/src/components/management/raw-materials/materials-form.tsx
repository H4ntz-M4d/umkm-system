"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateMaterialsSchemaInput,
  MaterialsData,
  MaterialsSchema,
  z,
} from "@repo/schemas";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type MaterialsInitialsData = z.infer<typeof MaterialsData>;

interface MaterialFormProps {
  onSubmit: (v: CreateMaterialsSchemaInput) => void;
  initialData?: MaterialsInitialsData;
  onOpenChange?: (open: boolean) => void;
  isSubmitting?: boolean;
}

export default function RawMaterialForm({
  onSubmit,
  initialData,
  onOpenChange,
  isSubmitting,
}: MaterialFormProps) {
  const form = useForm<CreateMaterialsSchemaInput>({
    resolver: zodResolver(MaterialsSchema),
    defaultValues: {
      name: "",
      unit: "",
      cost: 0,
      isActive: true,
    },
  });

  const [open, setOpen] = useState(false);
  const isOpen = open || !!initialData;
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        unit: initialData.unit,
        cost: Number(initialData.cost),
        isActive: initialData.isActive,
      });
    } else {
      form.reset({ name: "", unit: "", cost: 0, isActive: true });
    }
  }, [initialData, form]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    onOpenChange?.(val);
    if (!val) form.reset({ name: "", unit: "", cost: 0, isActive: true }); // Reset form saat tutup
  };

  const handleSubmit = (data: CreateMaterialsSchemaInput) => {
    onSubmit(data);
    handleOpenChange(false);
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-30">Add Store</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader className="py-4">
            <DialogTitle className={"text-lg"}>
              {isEditing
                ? "Edit Bahan Baku (Material)"
                : "Tambah Bahan Baku (Material)"}
            </DialogTitle>
            <DialogDescription>
              Tambahkan atau edit bahan baku disini. Kemudian klik save untuk
              menyimpan datanya
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="pt-1 pb-8">
            <Field>
              <FieldContent className="p-1 gap-3">
                <Controller
                  name={"name"}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Nama Material</FieldLabel>
                      <Input {...field} />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  name={"unit"}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Unit</FieldLabel>
                      <Input {...field} />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  name={"cost"}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Biaya bahan baku</FieldLabel>
                      <Input
                        {...field}
                        type={"number"}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        value={field.value?.toString()}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "true")}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent className="py-2">
                          <SelectItem value="true">Aktif</SelectItem>
                          <SelectItem value="false">Non Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type={"submit"} disabled={isSubmitting}>
              {isSubmitting ? "Sedang menyimpan" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
