"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, KeyRound, Save, Trash, Upload } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CustomerProfileSchema,
  type CustomerAddressDataType,
  type CustomerProfileInput,
} from "@repo/schemas";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/stores/userCustomerAuth";
import { useProfileOperations } from "@/hooks/public/use-profile-operations";
import AddressBox from "../address-box";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ProfileViewProps {
  addresses: CustomerAddressDataType[];
}

export default function ProfileView({ addresses }: ProfileViewProps) {
  const customer = useCustomerAuth((s) => s.user);
  const { save, isBusy } = useProfileOperations();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{ file: File; url: string } | null>(null);

  const form = useForm<CustomerProfileInput>({
    resolver: zodResolver(CustomerProfileSchema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (!customer) return;
    form.reset({ name: customer.name, phone: customer.phone ?? "" });
  }, [customer, form]);

  const replacePicked = (next: { file: File; url: string } | null) => {
    setPicked((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return next;
    });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Berkas harus berupa gambar");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }

    replacePicked({ file, url: URL.createObjectURL(file) });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const ok = await save(values, picked?.file);
    if (ok) replacePicked(null);
  });

  const shownImage = picked?.url ?? customer?.image ?? null;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Pengaturan Profil
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola data diri, alamat pengiriman, dan kata sandi Anda.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-warm">
          <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold overflow-hidden">
            {customer?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customer.image}
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials(customer?.name)
            )}
          </div>
          <div>
            <p className="font-medium text-card-foreground text-sm">
              {customer?.name ?? "-"}
            </p>
            <p className="text-xs text-muted-foreground">
              {customer?.email ?? "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Data diri */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-warm mb-6"
      >
        <h2 className="font-display text-xl font-semibold text-card-foreground mb-1">
          Data Diri
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Email dipakai untuk masuk sehingga tidak bisa diubah di sini.
        </p>

        <form onSubmit={onSubmit}>
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold overflow-hidden border-4 border-background shadow-warm">
                {shownImage ? (
                  // Pratinjau memakai blob URL lokal, jadi <img> biasa —
                  // next/image butuh dimensi tetap dan host yang terdaftar.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shownImage}
                    alt={customer?.name ?? "Foto profil"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials(customer?.name)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-warm hover:opacity-90 transition"
                aria-label="Ganti foto"
              >
                <Camera size={14} />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-card-foreground text-sm">
                Foto Profil
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG, atau WEBP. Maksimal 2MB.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={13} /> Pilih Foto
                </Button>
                {picked && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => replacePicked(null)}
                  >
                    <Trash size={13} /> Batalkan
                  </Button>
                )}
              </div>
              {picked && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  {picked.file.name} — baru tersimpan setelah menekan Simpan.
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Nama Lengkap</FieldLabel>
                  <Input {...field} maxLength={100} placeholder="Nama lengkap" />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={customer?.email ?? ""} disabled readOnly />
            </Field>

            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>No. Handphone</FieldLabel>
                  <Input
                    {...field}
                    type="tel"
                    maxLength={20}
                    placeholder="08xxxxxxxxxx"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Button type="submit" disabled={isBusy}>
              <Save size={16} /> {isBusy ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            {/* Ganti kata sandi lewat kode email, sesuai alur lupa kata sandi. */}
            <Link href="/forgot-password">
              <Button type="button" variant="secondary">
                <KeyRound size={16} /> Ganti Kata Sandi
              </Button>
            </Link>
          </div>
        </form>
      </motion.section>

      {/* Alamat */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-warm"
      >
        <div className="mb-6">
          <h2 className="font-display text-xl font-semibold text-card-foreground">
            Alamat Pengiriman
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Simpan beberapa alamat agar checkout lebih cepat.
          </p>
        </div>

        <AddressBox addresses={addresses} />
      </motion.section>
    </>
  );
}
