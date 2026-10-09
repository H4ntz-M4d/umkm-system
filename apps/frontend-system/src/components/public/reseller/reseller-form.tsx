"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RESELLER_BUSINESS_TYPES,
  RESELLER_MONTHLY_ESTIMATES,
  ResellerApplicationInput,
  ResellerApplicationSchema,
} from "@repo/schemas";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildResellerWhatsAppUrl } from "../../../../utils/whatsapp";

/**
 * Form calon reseller.
 *
 * Isinya TIDAK dikirim ke server mana pun: begitu disubmit, jawabannya
 * dirangkai jadi pesan WhatsApp dan percakapan langsung dibuka. Bentuk ini
 * dipilih untuk tahap awal supaya tidak ada data pengajuan yang menumpuk
 * tanpa ada yang mengurus. Skemanya sudah ditaruh di paket bersama, jadi saat
 * pengajuan mulai dicatat, formnya tinggal mengirim ke endpoint tanpa berubah
 * bentuk.
 */
export default function ResellerForm() {
  const [waUrl, setWaUrl] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResellerApplicationInput>({
    resolver: zodResolver(ResellerApplicationSchema),
    defaultValues: {
      name: "",
      phone: "",
      city: "",
      businessType: RESELLER_BUSINESS_TYPES[0],
      monthlyEstimate: RESELLER_MONTHLY_ESTIMATES[0],
      notes: "",
    },
  });

  const submit = (values: ResellerApplicationInput) => {
    const url = buildResellerWhatsAppUrl(values);
    setWaUrl(url);

    /// Dibuka otomatis supaya percakapannya langsung jalan. Pemblokir popup
    /// bisa menahannya — karena itu tautannya tetap ditampilkan di bawah
    /// sebagai jalan kedua, bukan mengandalkan yang ini saja.
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="space-y-4 rounded-2xl border border-border bg-card p-6"
    >
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Nama lengkap</FieldLabel>
            <Input placeholder="Nama Anda" {...field} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="phone"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Nomor WhatsApp</FieldLabel>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0812xxxxxxxx"
                {...field}
              />
              {errors.phone && <FieldError>{errors.phone.message}</FieldError>}
            </Field>
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Kota</FieldLabel>
              <Input placeholder="Contoh: Yogyakarta" {...field} />
              {errors.city && <FieldError>{errors.city.message}</FieldError>}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="businessType"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Jenis usaha</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {RESELLER_BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <Controller
          name="monthlyEstimate"
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel>Perkiraan pembelian per bulan</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {RESELLER_MONTHLY_ESTIMATES.map((estimate) => (
                    <SelectItem key={estimate} value={estimate}>
                      {estimate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Perkiraan kasar saja — bukan janji.
              </FieldDescription>
            </Field>
          )}
        />
      </div>

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel>Catatan (opsional)</FieldLabel>
            <Textarea
              className="h-20"
              placeholder="Produk yang diminati, rencana penjualan, atau pertanyaan lain."
              {...field}
            />
            {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
          </Field>
        )}
      />

      <Button type="submit" className="w-full gap-2">
        <MessageCircle size={16} />
        Kirim lewat WhatsApp
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Tombol ini membuka percakapan WhatsApp berisi data di atas. Pesannya
        baru terkirim setelah Anda menekan kirim di WhatsApp.
      </p>

      {waUrl && (
        <div className="rounded-xl bg-secondary/40 p-4 text-center text-sm">
          <p className="text-foreground">WhatsApp tidak terbuka otomatis?</p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-medium text-primary underline underline-offset-2"
          >
            Buka percakapannya di sini
          </a>
        </div>
      )}
    </form>
  );
}
