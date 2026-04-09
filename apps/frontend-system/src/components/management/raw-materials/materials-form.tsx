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
import { MaterialsData, MaterialsSchema, z } from "@repo/schemas";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type FormData = z.infer<typeof MaterialsSchema>;
type MaterialsInitialsData = z.infer<typeof MaterialsData>;

interface MaterialFormProps {
  onSubmit: (v: FormData) => void;
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
  const form = useForm<FormData>({
    resolver: zodResolver(MaterialsSchema),
    defaultValues: {
      name: "",
      unit: "",
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
        isActive: initialData.isActive,
      });
    } else {
      form.reset({ name: "", unit: "", isActive: true });
    }
  }, [initialData, form]);

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    onOpenChange?.(val);
    if (!val) form.reset({ name: "", isActive: true }); // Reset form saat tutup
  };

  const handleSubmit = (data: FormData) => {
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
