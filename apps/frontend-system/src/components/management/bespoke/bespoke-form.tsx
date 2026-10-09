"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BESPOKE_MIN_QUANTITY_CUSTOM,
  BespokeOrderDataType,
  BespokeOrderSchema,
  BespokeOrderSchemaInput,
} from "@repo/schemas";
import { useBespokeOperation } from "@/hooks/management/bespoke/use-bespoke-operation";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";

interface BespokeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /// Diisi kalau dialog dibuka untuk mengedit pesanan yang sudah ada.
  order?: BespokeOrderDataType | null;
}

const emptyValues: BespokeOrderSchemaInput = {
  title: "",
  description: "",
  productMasterId: null,
  quantity: 1,
  quotedPrice: 0,
  targetDate: new Date(),
  notes: "",
  customer: { name: "", email: "", phone: "" },
};

export function BespokeForm({ open, onOpenChange, order }: BespokeFormProps) {
  const isEditing = !!order;
  const {
    createBespokeData,
    updateBespokeData,
    isCreatingBespoke,
    isUpdatingBespoke,
  } = useBespokeOperation({});
  const { fetchProductVariantList } = useProductsOperation({
    enabledProductVariantList: true,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<BespokeOrderSchemaInput>({
    resolver: zodResolver(BespokeOrderSchema),
    defaultValues: emptyValues,
  });

  // Form diisi ulang tiap dialog dibuka, supaya tidak membawa sisa pesanan
  // yang dilihat sebelumnya.
  useEffect(() => {
    if (!open) return;

    reset(
      order
        ? {
            title: order.title,
            description: order.description ?? "",
            productMasterId: order.productMasterId,
            quantity: order.quantity,
            quotedPrice: Number(order.quotedPrice),
            targetDate: new Date(order.targetDate),
            notes: order.notes ?? "",
            customer: {
              name: order.customerName ?? "",
              email: order.customerEmail ?? "",
              phone: order.customerPhone ?? "",
            },
          }
        : emptyValues,
    );
  }, [open, order, reset]);

  /// useWatch, bukan watch: bentuk inilah yang bisa dioptimalkan React
  /// Compiler, dan polanya sama dengan form batch produksi.
  const productMasterId = useWatch({ control, name: "productMasterId" });
  const isFromCatalog = !!productMasterId;

  /// Satu baris per produk induk, bukan per varian: yang ditiru pesanan custom
  /// adalah modelnya, sedangkan warna dan ukurannya justru yang diubah.
  const productItems: ComboboxItem[] = (
    fetchProductVariantList?.data ?? []
  ).map((product) => ({
    value: product.id,
    label: product.name,
    description: `${product.variants.length} varian`,
    badge:
      product.status === "DRAFT"
        ? "Draft"
        : product.status === "NONACTIVE"
          ? "Nonaktif"
          : undefined,
    keywords: [product.name, ...product.variants.map((v) => v.sku)],
  }));

  const submit = async (data: BespokeOrderSchemaInput) => {
    try {
      if (order) await updateBespokeData({ id: order.id, data });
      else await createBespokeData(data);
      onOpenChange(false);
    } catch {
      // Toast galatnya sudah ditampilkan mutation; dialog dibiarkan terbuka
      // supaya isian admin tidak hilang.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] sm:max-w-xl bg-card overflow-hidden flex flex-col p-0">
        <form
          onSubmit={handleSubmit(submit)}
          className="flex flex-1 flex-col overflow-hidden p-4"
        >
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? "Edit Pesanan Custom" : "Pesanan Custom Baru"}
            </DialogTitle>
            <DialogDescription>
              Pesanan yang dibuat khusus untuk satu pembeli. Tidak menyentuh
              stok; uangnya dicatat sebagai kas masuk saat ditandai selesai.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="overflow-y-auto no-scrollbar">
            <div className="space-y-4 py-4 px-1">
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Judul Pesanan</FieldLabel>
                    <Input
                      placeholder="Contoh: Tote bag seragam komunitas"
                      {...field}
                    />
                    <FieldError>{errors.title?.message}</FieldError>
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Deskripsi (opsional)</FieldLabel>
                    <Textarea
                      className="h-20"
                      placeholder="Bahan, ukuran, warna, permintaan khusus..."
                      {...field}
                    />
                  </Field>
                )}
              />

              <Field>
                <FieldLabel>Asal desain</FieldLabel>
                {/* Menentukan berlaku-tidaknya jumlah minimum, jadi
                    dipisahkan sebagai pilihan tegas — bukan disimpulkan
                    diam-diam dari ada tidaknya produk yang dipilih. */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-auto flex-col gap-1 py-3 ${
                      isFromCatalog
                        ? "border ring-1 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => {
                      /// Produk pertama dipilihkan supaya penanda katalog tidak
                      /// pernah aktif tanpa acuan produk.
                      if (!isFromCatalog && productItems[0]) {
                        setValue("productMasterId", productItems[0].value, {
                          shouldValidate: true,
                        });
                      }
                    }}
                  >
                    <span className="text-sm font-medium">Dari katalog</span>
                    <span className="text-xs text-muted-foreground">
                      Boleh berapa pun, termasuk ganti warna
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={`h-auto flex-col gap-1 py-3 ${
                      !isFromCatalog
                        ? "border ring-1 ring-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() =>
                      setValue("productMasterId", null, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <span className="text-sm font-medium">Di luar katalog</span>
                    <span className="text-xs text-muted-foreground">
                      Minimal {BESPOKE_MIN_QUANTITY_CUSTOM} pcs
                    </span>
                  </Button>
                </div>
              </Field>

              {isFromCatalog && (
                <Controller
                  name="productMasterId"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Produk acuan</FieldLabel>
                      <Combobox
                        items={productItems}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Cari produk berdasarkan nama atau SKU"
                      />
                      <FieldError>{errors.productMasterId?.message}</FieldError>
                    </Field>
                  )}
                />
              )}

              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Jumlah (pcs)</FieldLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                      />
                      {!isFromCatalog && (
                        <p className="text-xs text-muted-foreground">
                          Desain di luar katalog minimal{" "}
                          {BESPOKE_MIN_QUANTITY_CUSTOM} pcs.
                        </p>
                      )}
                      <FieldError>{errors.quantity?.message}</FieldError>
                    </Field>
                  )}
                />

                <Controller
                  name="quotedPrice"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Harga Disepakati</FieldLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Contoh: 650000"
                        {...field}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                      />
                      <FieldError>{errors.quotedPrice?.message}</FieldError>
                    </Field>
                  )}
                />
              </FieldGroup>

              <Controller
                name="targetDate"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Target Selesai</FieldLabel>
                    <DatePickerSimple
                      value={field.value as Date}
                      onValueChange={(val) => field.onChange(val)}
                    />
                  </Field>
                )}
              />

              <div className="rounded-xl border border-border p-3 space-y-4">
                <div>
                  <p className="text-sm font-medium">Data Pemesan</p>
                  <p className="text-xs text-muted-foreground">
                    Email dipakai untuk mengenali pemesan lama, supaya
                    riwayatnya tidak terpecah jadi beberapa orang.
                  </p>
                </div>

                <Controller
                  name="customer.name"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Nama</FieldLabel>
                      <Input placeholder="Nama pemesan" {...field} />
                      <FieldError>{errors.customer?.name?.message}</FieldError>
                    </Field>
                  )}
                />

                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="customer.email"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Email</FieldLabel>
                        <Input placeholder="nama@email.com" {...field} />
                        <FieldError>
                          {errors.customer?.email?.message}
                        </FieldError>
                      </Field>
                    )}
                  />

                  <Controller
                    name="customer.phone"
                    control={control}
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Nomor WhatsApp</FieldLabel>
                        <Input placeholder="08xxxxxxxxxx" {...field} />
                        <FieldError>
                          {errors.customer?.phone?.message}
                        </FieldError>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Catatan (opsional)</FieldLabel>
                    <Textarea
                      className="h-20"
                      placeholder="Catatan internal..."
                      {...field}
                    />
                  </Field>
                )}
              />
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isCreatingBespoke || isUpdatingBespoke}
            >
              {isCreatingBespoke || isUpdatingBespoke
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
