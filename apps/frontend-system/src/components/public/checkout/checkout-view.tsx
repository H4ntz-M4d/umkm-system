"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin, Plus, Truck } from "lucide-react";
import {
  CheckoutShipmentSchema,
  type CartDataType,
  type CustomerAddressDataType,
  type CheckoutInput,
} from "@repo/schemas";
import { z } from "@repo/schemas";
import { checkout } from "@/lib/queries/public/order.query";
import { useSnap } from "@/hooks/public/use-snap";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toIDR } from "../../../../utils/format-money";

type ShipmentInput = z.infer<typeof CheckoutShipmentSchema>;

const COURIERS = ["JNE", "J&T", "SiCepat", "AnterAja", "Pos Indonesia"];

const emptyShipment: ShipmentInput = {
  recipientName: "",
  phone: "",
  addressLine: "",
  city: "",
  province: "",
};

interface CheckoutViewProps {
  cart: CartDataType;
  addresses: CustomerAddressDataType[];
}

export default function CheckoutView({ cart, addresses }: CheckoutViewProps) {
  const router = useRouter();
  const { pay } = useSnap();

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string | null>(
    defaultAddress?.id ?? null,
  );
  // Customer yang belum punya alamat langsung disodori formnya.
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [isPaying, setIsPaying] = useState(false);

  const form = useForm<ShipmentInput>({
    resolver: zodResolver(CheckoutShipmentSchema),
    defaultValues: emptyShipment,
  });

  const [saveAddress, setSaveAddress] = useState(true);

  const startPayment = async (payload: CheckoutInput) => {
    setIsPaying(true);

    try {
      const result = await checkout(payload);
      const { snapToken, orderId } = result.data;

      // Ke mana pun akhirnya, arahkan ke halaman pesanan: status sebenarnya
      // ditentukan webhook, bukan callback ini.
      const goToOrder = () => router.push(`/orders/${orderId}`);

      await pay(snapToken, {
        onSuccess: goToOrder,
        onPending: goToOrder,
        onError: () => {
          toast.error("Pembayaran gagal");
          goToOrder();
        },
        onClose: () => {
          toast.info("Pembayaran belum diselesaikan", {
            description: "Pesanan tersimpan, kamu bisa melanjutkannya nanti.",
          });
          goToOrder();
        },
      });
    } catch (error) {
      toast.error("Gagal memproses checkout", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleExistingAddress = async () => {
    if (!addressId) {
      toast.error("Pilih alamat pengiriman dulu");
      return;
    }

    await startPayment({ addressId, courier });
  };

  const handleNewAddress = form.handleSubmit(async (shipment) => {
    await startPayment({ shipment, courier, saveAddress });
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Kiri: alamat & kurir */}
      <div className="flex-1 space-y-6">
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
                      {address.addressLine}, {address.city}, {address.province}
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

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                />
                Simpan alamat ini untuk pesanan berikutnya
              </label>

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
            Ongkir sedang digratiskan untuk semua kurir.
          </p>
        </section>
      </div>

      {/* Kanan: ringkasan */}
      <aside className="w-full lg:w-96 shrink-0">
        <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-card-foreground">
            Ringkasan Pesanan
          </h2>

          <div className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3">
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
                    {Object.values(item.options).join(" · ")} · {item.quantity}x
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {toIDR(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({cart.totalItems} item)</span>
              <span>{toIDR(cart.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ongkir</span>
              <span className="font-medium text-secondary">Gratis</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-display font-semibold text-card-foreground">
              Total
            </span>
            <span className="font-display text-lg font-bold text-primary">
              {toIDR(cart.totalAmount)}
            </span>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={isPaying}
            onClick={useNewAddress ? handleNewAddress : handleExistingAddress}
          >
            {isPaying ? "Memproses..." : "Bayar Sekarang"}
          </Button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Pembayaran diproses aman oleh Midtrans
          </p>
        </div>
      </aside>
    </div>
  );
}
