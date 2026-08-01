"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { CartDataType } from "@repo/schemas";
import { useCart } from "@/hooks/public/use-cart";

interface CartBadgeProps {
  serverCart: CartDataType | null;
  isLoggedIn: boolean;
}

export default function CartBadge({ serverCart, isLoggedIn }: CartBadgeProps) {
  const { totalItems, hydrated } = useCart({ serverCart, isLoggedIn });

  return (
    <Link
      href="/cart"
      aria-label="Keranjang"
      className="relative p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors"
    >
      <ShoppingBag size={20} />
      {hydrated && totalItems > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
