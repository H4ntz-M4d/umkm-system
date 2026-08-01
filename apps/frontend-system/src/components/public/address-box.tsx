"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  CustomerAddressSchema,
  type CustomerAddressDataType,
  type CustomerAddressSchemaInput,
} from "@repo/schemas";
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useAddressOperations } from "@/hooks/public/use-address-operations";

const emptyAddress: CustomerAddressSchemaInput = {
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  province: "",
};

interface AddressBoxProps {
  addresses: CustomerAddressDataType[];
}

export default function AddressBox({ addresses }: AddressBoxProps) {
  const { create, update, makeDefault, remove, isBusy } = useAddressOperations();

  const [isFormOpen, setIsFormOpen] = useState(false);
  // Berisi alamat yang sedang diubah; null berarti sedang menambah baru.
  const [editing, setEditing] = useState<CustomerAddressDataType | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<CustomerAddressDataType | null>(null);

  const form = useForm<CustomerAddressSchemaInput>({
    resolver: zodResolver(CustomerAddressSchema),
    defaultValues: emptyAddress,
  });

  // Form diisi ulang tiap dialog dibuka supaya tidak membawa sisa isian
  // alamat yang dibuka sebelumnya.
  useEffect(() => {
    if (!isFormOpen) return;

    form.reset(
      editing
        ? {
            recipientName: editing.recipientName,
            phone: editing.phone,
            addressLine: editing.addressLine,
            city: editing.city,
            province: editing.province,
            isDefault: editing.isDefault,
          }
        : emptyAddress,
    );
  }, [isFormOpen, editing, form]);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (address: CustomerAddressDataType) => {
    setEditing(address);
    setIsFormOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const ok = editing
      ? await update(editing.id, values)
      : await create(values);

    // Dialog hanya ditutup kalau simpannya berhasil, supaya isian tidak hilang.
    if (ok) setIsFormOpen(false);
  });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <div className={isBusy ? "opacity-70" : ""}>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={openCreate} disabled={isBusy}>
          <Plus size={16} /> Tambah Alamat
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <MapPin size={32} className="mx-auto text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">
            Belum ada alamat tersimpan
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tambahkan alamat agar checkout lebih cepat.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`rounded-xl border p-4 transition-colors ${
                address.isDefault
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold text-card-foreground">
                    {address.recipientName}
                    {address.isDefault && (
                      <span className="ml-2 rounded-md bg-secondary/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary">
                        Utama
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground">{address.phone}</p>
                  <p className="text-muted-foreground">
                    {address.addressLine}, {address.city}, {address.province}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {!address.isDefault && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => void makeDefault(address.id)}
                    >
                      <Star size={14} /> Jadikan Utama
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => openEdit(address)}
                  >
                    <Pencil size={14} /> Ubah
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={isBusy}
                    onClick={() => setPendingDelete(address)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form tambah / ubah */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Ubah Alamat" : "Tambah Alamat"}
            </DialogTitle>
            <DialogDescription>
              Alamat ini bisa dipilih saat checkout.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Controller
                name="recipientName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Nama Penerima</FieldLabel>
                    <Input {...field} placeholder="Nama lengkap penerima" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Nomor Telepon</FieldLabel>
                    <Input {...field} placeholder="08xxxxxxxxxx" />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <Controller
                name="addressLine"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Alamat Lengkap</FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Nama jalan, nomor rumah, RT/RW, patokan"
                    />
                    {fieldState.error && (
                      <FieldError>{fieldState.error.message}</FieldError>
                    )}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  name="city"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Kota</FieldLabel>
                      <Input {...field} placeholder="Yogyakarta" />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="province"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Provinsi</FieldLabel>
                      <Input {...field} placeholder="DI Yogyakarta" />
                      {fieldState.error && (
                        <FieldError>{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="isDefault"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={Boolean(field.value)}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Jadikan alamat utama
                  </label>
                )}
              />
            </FieldGroup>

            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isBusy}>
                {isBusy ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus alamat ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Alamat atas nama {pendingDelete?.recipientName} akan dihapus
              permanen. Pesanan yang sudah dibuat tidak terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={isBusy} onClick={handleDelete}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
