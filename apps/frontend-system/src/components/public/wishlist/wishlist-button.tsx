"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleWishlist } from "@/lib/queries/public/wishlist.query";

interface WishlistButtonProps {
  productMasterId: string;
  initialInWishlist?: boolean;
  isLoggedIn?: boolean;
  /// "icon" untuk overlay di kartu katalog, "full" untuk tombol di halaman detail.
  variant?: "icon" | "full";
}

export default function WishlistButton({
  productMasterId,
  initialInWishlist = false,
  isLoggedIn = false,
  variant = "icon",
}: WishlistButtonProps) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async (event: React.MouseEvent) => {
    // Kartu katalog membungkus tombol ini di dalam <Link>, jadi klik harus
    // dihentikan supaya tidak ikut membuka halaman produk.
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Optimistis: balikkan lagi kalau request gagal.
    const previous = inWishlist;
    setInWishlist(!previous);

    try {
      const result = await toggleWishlist(productMasterId);
      setInWishlist(result.data.inWishlist);
      toast.success(
        result.data.inWishlist
          ? "Ditambahkan ke wishlist"
          : "Dihapus dari wishlist",
      );
      // Halaman wishlist di-render server, jadi perlu diminta render ulang.
      startTransition(() => router.refresh());
    } catch (error) {
      setInWishlist(previous);
      toast.error("Gagal memperbarui wishlist", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border text-sm font-semibold transition-colors disabled:opacity-60 ${
          inWishlist
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-foreground hover:bg-secondary"
        }`}
      >
        <Heart size={18} fill={inWishlist ? "currentColor" : "none"} />
        {inWishlist ? "Tersimpan" : "Wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={inWishlist ? "Hapus dari wishlist" : "Tambah ke wishlist"}
      className={`absolute bottom-3 right-3 z-10 grid h-9 w-9 place-content-center rounded-full backdrop-blur-sm transition-colors disabled:opacity-60 ${
        inWishlist
          ? "bg-primary text-primary-foreground"
          : "bg-background/80 text-foreground/70 hover:bg-background hover:text-primary"
      }`}
    >
      <Heart size={16} fill={inWishlist ? "currentColor" : "none"} />
    </button>
  );
}
