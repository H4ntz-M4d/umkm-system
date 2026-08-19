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
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

type FormData = z.infer<typeof StoreSchema>;

interface StoreFormProps {
  onSubmit: (v: FormData) => void;
  initialData?: StoreData;
  isOpen: boolean
  onOpenChange: (open: boolean) => void;
}

export default function StoreForm({
  onSubmit,
  initialData,
  isOpen,
  onOpenChange,
}: StoreFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(StoreSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        isActive: initialData.isActive,
        isOnlineSource: initialData.isOnlineSource,
      });
    } else {
      form.reset({ name: "", isActive: true, isOnlineSource: false });
    }
  }, [initialData, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader className="py-4">
            <DialogTitle className={"text-lg"}>
              {isEditing ? "Edit Toko" : "Tambah Toko"}
            </DialogTitle>
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
              <FieldContent className="p-1">
                <Label>Sumber penjualan online</Label>
                <Controller
                  control={form.control}
                  name="isOnlineSource"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(val === "true")}
                      value={field.value ? "true" : "false"}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih" />
                      </SelectTrigger>
                      <SelectContent className="py-2">
                        <SelectItem value="false">Tidak</SelectItem>
                        <SelectItem value="true">Ya</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Stok toko inilah yang dijual di halaman publik. Hanya satu
                  toko yang bisa menjadi sumber online — menandai toko ini
                  otomatis mencabut tanda dari toko sebelumnya.
                </p>
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
