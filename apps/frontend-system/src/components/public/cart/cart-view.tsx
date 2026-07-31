"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { CartDataType } from "@repo/schemas";
import { useCart } from "@/hooks/public/use-cart";
import { toIDR } from "../../../../utils/format-money";
import { Button } from "@/components/ui/button";

interface CartViewProps {
  serverCart: CartDataType | null;
  isLoggedIn: boolean;
}

export default function CartView({ serverCart, isLoggedIn }: CartViewProps) {
  const {
    items,
    totalItems,
    totalAmount,
    setQuantity,
    remove,
    isBusy,
    hydrated,
  } = useCart({ serverCart, isLoggedIn });

  // Sebelum localStorage terbaca, isi keranjang guest belum diketahui. Jangan
  // tampilkan "kosong" dulu supaya tidak berkedip.
  if (!hydrated) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Memuat keranjang...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag size={40} className="mx-auto text-muted-foreground/40" />
        <p className="font-display text-lg text-muted-foreground mt-4">
          Keranjang kamu masih kosong
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Yuk pilih rajutan yang kamu suka
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-terracotta-dark transition-colors"
        >
          Jelajahi Koleksi
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col lg:flex-row gap-8 ${isBusy ? "opacity-70" : ""}`}
    >
      {/* Daftar item */}
      <div className="flex-1 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <Link
              href={`/products/${item.slug}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary/20"
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.productName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                  Tanpa gambar
                </div>
              )}
            </Link>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-display text-sm font-semibold text-card-foreground hover:text-primary transition-colors"
                  >
                    {item.productName}
                  </Link>
                  {Object.keys(item.options).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Object.entries(item.options)
                        .map(([type, value]) => `${type}: ${value}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-primary mt-1">
                    {toIDR(item.price)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void remove(item.id)}
                  disabled={isBusy}
                  aria-label="Hapus dari keranjang"
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex items-center rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => void setQuantity(item.id, item.quantity - 1)}
                    disabled={isBusy || item.quantity <= 1}
                    className="p-2 text-foreground/70 hover:text-foreground disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-sm font-medium min-w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => void setQuantity(item.id, item.quantity + 1)}
                    disabled={
                      isBusy ||
                      (item.productType === "RESTOCK" &&
                        item.quantity >= item.stock)
                    }
                    className="p-2 text-foreground/70 hover:text-foreground disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="text-sm font-semibold text-foreground">
                  {toIDR(item.subtotal)}
                </p>
              </div>

              {item.quantity >= item.stock && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Jumlah maksimal sesuai stok tersisa ({item.stock})
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ringkasan */}
      <aside className="w-full lg:w-100 shrink-0">
        <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-card-foreground">
            Ringkasan Belanja
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Total item</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{toIDR(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Ongkir</span>
              <span className="text-secondary font-medium">Gratis</span>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4 flex justify-between">
            <span className="font-display font-semibold text-card-foreground">
              Total
            </span>
            <span className="font-display text-lg font-bold text-primary">
              {toIDR(totalAmount)}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link href={isLoggedIn ? "/checkout" : "/login"} className="w-full">
              <Button size={"lg"} type="button" className="w-full">
                {isLoggedIn ? "Lanjut ke Pembayaran" : "Login untuk Checkout"}
              </Button>
            </Link>
            <Link href={"/products"}>
              <Button
                size={"lg"}
                variant={"outline"}
                type="button"
                className="w-full"
              >
                Lanjutkan belanja
              </Button>
            </Link>
          </div>

          {!isLoggedIn && (
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Keranjangmu akan tetap tersimpan setelah login
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
