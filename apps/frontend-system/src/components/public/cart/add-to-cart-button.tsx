"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/public/use-cart";
import type { GuestCartItem } from "@/stores/cart.store";

interface AddToCartButtonProps {
  item: GuestCartItem | null;
  isLoggedIn: boolean;
  disabled?: boolean;
  /// Alasan tombol dinonaktifkan, dipakai sebagai label (mis. "Stok Habis").
  disabledLabel?: string;
}

export default function AddToCartButton({
  item,
  isLoggedIn,
  disabled = false,
  disabledLabel,
}: AddToCartButtonProps) {
  // Guest tetap boleh menambah; keranjangnya disimpan lokal lalu digabung ke
  // server saat login. serverCart tidak diperlukan di sini karena tombol ini
  // hanya menulis, tidak menampilkan isi keranjang.
  const { add, isBusy } = useCart({ isLoggedIn });

  const handleClick = async () => {
    if (!item) {
      toast.error("Kombinasi varian ini tidak tersedia");
      return;
    }

    await add(item);
    toast.success(`${item.snapshot.productName} ditambahkan ke keranjang`, {
      description: `${Object.values(item.snapshot.options).join(" · ")} · ${item.quantity}x`,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isBusy || !item}
      className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-terracotta-dark transition-colors shadow-warm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ShoppingBag size={18} />
      {disabled && disabledLabel
        ? disabledLabel
        : isBusy
          ? "Menambahkan..."
          : "Tambah ke Keranjang"}
    </button>
  );
}
