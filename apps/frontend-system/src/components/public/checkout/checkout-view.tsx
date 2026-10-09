"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Controller, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, MapPin, Plus, Store, Truck } from "lucide-react";
import {
  CheckoutShipmentSchema,
  z,
  type CartDataType,
  type CustomerAddressDataType,
  type SubmitOrderInput,
} from "@repo/schemas";
import { submitOrder } from "@/lib/queries/public/order.query";
import { useCart } from "@/hooks/public/use-cart";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toIDR } from "../../../../utils/format-money";
import { buildOrderWhatsAppUrl } from "../../../../utils/whatsapp";

const COURIERS = ["JNE", "J&T", "SiCepat", "AnterAja", "Pos Indonesia"];

const emptyShipment = {
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  province: "",
};

/**
 * Bentuk longgar alamat: kolomnya boleh kosong.
 *
 * BUKAN `CheckoutShipmentSchema.partial()`. `.partial()` hanya membolehkan
 * key-nya TIDAK ADA — sementara `defaultValues.shipment` selalu membawa kelima
 * kolom itu berisi string kosong, jadi key-nya selalu ada dan batas `min(3)`
 * tetap dijalankan. Akibatnya alamat ikut diwajibkan meski pesanannya diambil
 * sendiri.
 *
 * Bentuknya dijaga tetap sama dengan versi ketatnya supaya `FormValues` tidak
 * berubah saat metode pengambilan berganti.
 */
const LooseShipmentSchema = z.object({
  recipientName: z.string(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  province: z.string(),
});

/**
 * Alamat hanya wajib ketika pesanan dikirim DAN alamatnya diketik baru —
 * yang memilih alamat tersimpan atau mengambil sendiri tidak perlu mengisinya.
 *
 * Skemanya dibangun ulang saat kondisi itu berubah, bukan dipaksakan jadi satu
 * bentuk dengan semua field opsional: dengan begitu pesan galat per-field tetap
 * muncul persis di kolom yang kosong saat alamatnya memang wajib.
 */
const buildFormSchema = (needsTypedAddress: boolean) =>
  z.object({
    buyerName: z.string().min(3, "Nama minimal memiliki panjang 3 karakter"),
    buyerPhone: z
      .string()
      .min(8, "Nomor WhatsApp tidak valid")
      .regex(/^[0-9+\s-]+$/, "Nomor WhatsApp hanya boleh berisi angka"),
    shipment: needsTypedAddress ? CheckoutShipmentSchema : LooseShipmentSchema,
  });

type FormValues = {
  buyerName: string;
  buyerPhone: string;
  shipment: typeof emptyShipment;
};

type DeliveryMethod = "SHIP" | "PICKUP";

type SubmittedOrder = {
  orderId: string;
  waUrl: string;
  isGuest: boolean;
};

interface CheckoutViewProps {
  /// Keranjang hasil render server — hanya terisi untuk customer yang login.
  serverCart: CartDataType | null;
  addresses: CustomerAddressDataType[];
  isLoggedIn: boolean;
}

export default function CheckoutView({
  serverCart,
  addresses,
  isLoggedIn,
}: CheckoutViewProps) {
  const router = useRouter();
  const { items, totalAmount, totalItems, clearLocal, hydrated } = useCart({
    serverCart,
    isLoggedIn,
  });

  const defaultAddress =
    addresses.find((address) => address.isDefault) ?? addresses[0];

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("SHIP");
  const [addressId, setAddressId] = useState<string | null>(
    defaultAddress?.id ?? null,
  );
  // Yang belum punya alamat tersimpan langsung disodori formnya.
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedOrder | null>(null);

  const needsTypedAddress = deliveryMethod === "SHIP" && useNewAddress;

  /// Dibangun ulang hanya saat syarat alamatnya berubah, bukan tiap render.
  const resolver = useMemo(
    () => zodResolver(buildFormSchema(needsTypedAddress)) as Resolver<FormValues>,
    [needsTypedAddress],
  );

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      /// Diisikan dari alamat utama supaya customer lama tidak mengetik ulang.
      buyerName: defaultAddress?.recipientName ?? "",
      buyerPhone: defaultAddress?.phone ?? "",
      shipment: emptyShipment,
    },
  });

  const waSummaryItems = useMemo(
    () =>
      items.map((item) => ({
        productName: item.productName,
        sku: item.sku,
        variantLabel: Object.values(item.options).join(" / "),
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        notes: notes[item.productVariantId],
      })),
    [items, notes],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (items.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    if (deliveryMethod === "SHIP" && !useNewAddress && !addressId) {
      toast.error("Pilih alamat pengiriman dulu");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: SubmitOrderInput = {
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          notes: notes[item.productVariantId]?.trim() || undefined,
        })),
        deliveryMethod,
        buyerName: values.buyerName,
        buyerPhone: values.buyerPhone,
        ...(deliveryMethod === "SHIP" &&
          (useNewAddress
            ? {
                shipment: values.shipment as z.infer<
                  typeof CheckoutShipmentSchema
                >,
                courier,
                saveAddress: isLoggedIn ? saveAddress : false,
              }
            : { addressId: addressId ?? undefined, courier })),
      };

      const result = await submitOrder(payload);

      const waUrl = buildOrderWhatsAppUrl({
        orderId: result.data.orderId,
        buyerName: values.buyerName,
        items: waSummaryItems,
        estimatedTotal: result.data.estimatedTotal,
        deliveryMethod,
      });

      clearLocal();
      setSubmitted({
        orderId: result.data.orderId,
        waUrl,
        isGuest: result.data.isGuest,
      });

      // Dibuka otomatis supaya percakapannya langsung jalan. Bisa saja ditahan
      // pemblokir popup — karena itu panel di bawah tetap menampilkan tombolnya
      // sebagai jalan kedua, bukan mengandalkan yang ini saja.
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Pesanan gagal diajukan", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto text-secondary" size={48} />
        <h2 className="mt-4 font-display text-xl font-bold text-card-foreground">
          Pesanan berhasil diajukan
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nomor pesananmu <span className="font-semibold">{submitted.orderId}</span>.
          Lanjutkan obrolan di WhatsApp untuk menyepakati harga dan DP-nya.
        </p>

        <a href={submitted.waUrl} target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="mt-5 w-full">
            Buka WhatsApp
          </Button>
        </a>

        {submitted.isGuest ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Simpan nomor pesanan di atas. Karena memesan tanpa akun, status
            pesanan ini dikabarkan lewat WhatsApp.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/orders/${submitted.orderId}`)}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Lihat status pesanan
          </button>
        )}
      </div>
    );
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Keranjangmu masih kosong.
        </p>
        <Link href="/products">
          <Button className="mt-4">Lihat katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        {!isLoggedIn && (
          <p className="rounded-xl border border-dashed border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
            Memesan tanpa akun tidak masalah.{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Masuk dulu
            </Link>{" "}
            kalau ingin pesananmu tercatat di Riwayat Pesanan dan bisa dipantau
            sendiri.
          </p>
        )}

        {/* Kontak pemesan */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-card-foreground">
            Kontak Pemesan
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Semua kelanjutan pesanan dibicarakan lewat nomor ini.
          </p>

          <FieldGroup className="mt-4">
            <Controller
              name="buyerName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Nama</FieldLabel>
                  <Input {...field} placeholder="Nama kamu" />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
            <Controller
              name="buyerPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Nomor WhatsApp</FieldLabel>
                  <Input {...field} placeholder="08xxxxxxxxxx" />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </section>

        {/* Cara terima pesanan */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold text-card-foreground">
            Cara Terima Pesanan
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setDeliveryMethod("SHIP")}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                deliveryMethod === "SHIP"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/50"
              }`}
            >
              <Truck size={18} className="mt-0.5 text-primary" />
              <span className="text-sm">
                <span className="block font-semibold text-card-foreground">
                  Dikirim
                </span>
                <span className="text-muted-foreground">
                  Ongkir dibicarakan saat nego
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMethod("PICKUP")}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                deliveryMethod === "PICKUP"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary/50"
              }`}
            >
              <Store size={18} className="mt-0.5 text-primary" />
              <span className="text-sm">
                <span className="block font-semibold text-card-foreground">
                  Ambil di tempat
                </span>
                <span className="text-muted-foreground">
                  Diambil sendiri di rumah produksi
                </span>
              </span>
            </button>
          </div>
        </section>

        {deliveryMethod === "SHIP" && (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-card-foreground">
                <MapPin size={18} className="text-primary" />
                Alamat Pengiriman
              </h2>

              {addresses.length > 0 && (
                <div className="mt-4 space-y-2">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
                        !useNewAddress && addressId === address.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="mt-1 accent-primary"
                        checked={!useNewAddress && addressId === address.id}
                        onChange={() => {
                          setUseNewAddress(false);
                          setAddressId(address.id);
                        }}
                      />
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
                          {address.addressLine}, {address.city},{" "}
                          {address.province}
                        </p>
                      </div>
                    </label>
                  ))}

                  {!useNewAddress && (
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(true)}
                      className="flex items-center gap-1.5 pt-1 text-sm font-medium text-primary hover:underline"
                    >
                      <Plus size={14} /> Pakai alamat lain
                    </button>
                  )}
                </div>
              )}

              {useNewAddress && (
                <FieldGroup className="mt-4">
                  <Controller
                    name="shipment.recipientName"
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
                    name="shipment.phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel>Nomor Telepon Penerima</FieldLabel>
                        <Input {...field} placeholder="08xxxxxxxxxx" />
                        {fieldState.error && (
                          <FieldError>{fieldState.error.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="shipment.addressLine"
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
                      name="shipment.city"
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
                      name="shipment.province"
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

                  {isLoggedIn && (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={saveAddress}
                        onChange={(event) =>
                          setSaveAddress(event.target.checked)
                        }
                      />
                      Simpan alamat ini untuk pesanan berikutnya
                    </label>
                  )}

                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(false)}
                      className="self-start text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      Pakai alamat tersimpan
                    </button>
                  )}
                </FieldGroup>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-card-foreground">
                <Truck size={18} className="text-primary" />
                Kurir
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {COURIERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setCourier(option)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      courier === option
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ongkir belum dihitung di sini — disepakati bersama harga di
                WhatsApp.
              </p>
            </section>
          </>
        )}
      </div>

      {/* Kanan: ringkasan + catatan per item */}
      <aside className="w-full lg:w-96 shrink-0">
        <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-card-foreground">
            Rincian Pesanan
          </h2>

          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/20">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-card-foreground line-clamp-1">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Object.values(item.options).join(" · ")} ·{" "}
                      {item.quantity}x
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {toIDR(item.subtotal)}
                  </p>
                </div>

                <Textarea
                  rows={2}
                  value={notes[item.productVariantId] ?? ""}
                  maxLength={500}
                  onChange={(event) =>
                    setNotes((current) => ({
                      ...current,
                      [item.productVariantId]: event.target.value,
                    }))
                  }
                  placeholder="Permintaan khusus (opsional): ganti warna, motif, ukuran…"
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Perkiraan ({totalItems} item)</span>
              <span>{toIDR(totalAmount)}</span>
            </div>
          </div>

          {/* Harga katalog cuma gambaran — dikatakan terus terang di sini
              supaya pembeli tidak merasa harganya berubah diam-diam nanti. */}
          <p className="mt-3 rounded-lg bg-secondary/10 p-3 text-xs text-muted-foreground">
            Angka di atas baru perkiraan dari harga katalog. Harga akhir,
            ongkir, dan DP disepakati lewat WhatsApp — bisa berbeda, apalagi
            untuk pesanan jumlah banyak atau permintaan khusus.
          </p>

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? "Mengirim..." : "Pesan lewat WhatsApp"}
          </Button>
        </div>
      </aside>
    </form>
  );
}
