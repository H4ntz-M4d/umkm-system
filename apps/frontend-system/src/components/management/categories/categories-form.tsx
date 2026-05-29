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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCategoriesOperation } from "@/hooks/management/categories/use-categories-operation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategoriesSchema, CategoriesSchemaInput } from "@repo/schemas";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

interface CategoriesFormProps {
  idData?: string;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  initialValues?: CategoriesSchemaInput;
}

const defaultValues: CategoriesSchemaInput = {
  name: "",
  description: "",
  status: false,
  slug: "",
};

export default function CategoriesForm({
  idData,
  isOpen,
  onOpenChange,
  initialValues,
}: CategoriesFormProps) {
  const form = useForm<CategoriesSchemaInput>({
    resolver: zodResolver(CategoriesSchema),
    defaultValues: defaultValues,
    values: initialValues,
  });

  const {
    createCategoriesData,
    isCreateCategoriesData,
    updateCategoriesData,
    isUpdateCategoriesData,
  } = useCategoriesOperation({});

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/ /g, "-");
  };

  const isSubmitting = isCreateCategoriesData || isUpdateCategoriesData;

  const onSubmitData = async (data: CategoriesSchemaInput) => {
    if (idData) {
      updateCategoriesData({ id: idData, data: data });
    } else {
      createCategoriesData(data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        form.reset(initialValues);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [isOpen, initialValues, form]);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Kategori</DialogTitle>
          <DialogDescription>
            Masukkan data dari kategori yang ingin di buat
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmitData, (error) =>
            console.log(error),
          )}
        >
          <div className="space-y-5">
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Nama</FieldLabel>
                    <Input
                      placeholder="Masukkan nama kategori"
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v.target.value);
                        const slug = generateSlug(v.target.value);
                        form.setValue("slug", slug, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Field>
                )}
              />
              <Controller
                name="slug"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Slug</FieldLabel>
                    <Input placeholder="sweater" {...field} />
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Deskripsi</FieldLabel>
                    <Textarea
                      placeholder="Deskripsi"
                      className="h-20"
                      {...field}
                    />
                  </Field>
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Field orientation={"horizontal"}>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(val) => field.onChange(val)}
                      />
                      {field.value ? "Aktif" : "Tidak Aktif"}
                    </Field>
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant={"outline"}>
                  Batal
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                Simpan
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
