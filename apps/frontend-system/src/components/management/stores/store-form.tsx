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
import { Field, FieldContent, FieldGroup } from "@/components/ui/field";
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
import { StoreData, StoreSchema, z } from "@repo/schemas";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type FormData = z.infer<typeof StoreSchema>;

interface StoreFormProps {
  onSubmit: (v: FormData) => void;
  initialData?: StoreData;
  onOpenChange?: (open: boolean) => void;
}

export default function StoreForm({
  onSubmit,
  initialData,
  onOpenChange,
}: StoreFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(StoreSchema),
  });

  const [open, setOpen] = useState(false);
  const isOpen = open || !!initialData
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        isActive: initialData.isActive,
      });
    } else {
      form.reset({ name: "", isActive: true });
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
            <DialogTitle className={"text-lg"}>{isEditing ? "Edit Toko" : "Tambah Toko"}</DialogTitle>
            <DialogDescription>
              Tambahkan atau edit nama toko disini. Kemudian klik save untuk
              menyimpan datanya
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="pt-1 pb-8">
            <Field>
              <FieldContent className="p-1">
                <Label>Nama</Label>
                <Input {...form.register("name")} placeholder="Nama Toko" />
              </FieldContent>
              <FieldContent className="p-1">
                <Label>Status</Label>
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
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
                  )}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type={"submit"}>Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
