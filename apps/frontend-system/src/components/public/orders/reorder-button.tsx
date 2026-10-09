"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { CustomerOrderItemDataType } from "@repo/schemas";
import { addCartItem } from "@/lib/queries/public/cart.query";

/**
 * Memesan ulang isi satu pesanan lama.
 *
 * Seluruh barangnya dimasukkan kembali ke keranjang, lalu pembeli diantar ke
 * keranjang untuk memeriksa dulu — bukan langsung ke checkout. Harga dan
 * ketersediaan bisa sudah berubah sejak pesanan itu dibuat, jadi keputusannya
 * tetap di tangan pembeli.
 *
 * Barang yang sudah ditarik dari katalog dilewati dan disebutkan namanya.
 * Diam-diam melewatkannya lebih buruk daripada mengatakannya: pembeli akan
 * mengira pesanannya lengkap.
 */
export default function ReorderButton({
  items,
  className,
}: {
  items: CustomerOrderItemDataType[];
  className?: string;
}) {
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);

  const available = items.filter((item) => item.isAvailable);
  const missing = items.filter((item) => !item.isAvailable);

  const handleClick = async () => {
    if (available.length === 0) {
      toast.error("Tidak ada barang yang bisa dipesan ulang", {
        description: "Semua barang di pesanan ini sudah tidak dijual lagi.",
      });
      return;
    }

    setIsWorking(true);
    const failed: string[] = [];

    try {
      /// Satu per satu, bukan berbarengan: keranjang menjumlahkan jumlah pada
      /// varian yang sama, dan permintaan yang berlomba bisa saling menimpa.
      for (const item of available) {
        try {
          await addCartItem({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          });
        } catch {
          failed.push(item.productName);
        }
      }

      const added = available.length - failed.length;

      if (added === 0) {
        toast.error("Gagal menambahkan ke keranjang", {
          description: "Coba lagi sebentar lagi.",
        });
        return;
      }

      const notes = [
        missing.length > 0 &&
          `${missing.length} barang dilewati karena sudah tidak dijual`,
        failed.length > 0 && `${failed.length} barang gagal ditambahkan`,
      ].filter(Boolean);

      toast.success(`${added} barang masuk ke keranjang`, {
        description:
          notes.length > 0
            ? notes.join(". ")
            : "Periksa dulu jumlah dan harganya sebelum memesan.",
      });

      router.push("/cart");
      router.refresh();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isWorking || available.length === 0}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
      }
      title={
        available.length === 0
          ? "Semua barang di pesanan ini sudah tidak dijual"
          : undefined
      }
    >
      <RotateCcw size={16} />
      {isWorking ? "Menambahkan..." : "Pesan lagi"}
    </button>
  );
}
