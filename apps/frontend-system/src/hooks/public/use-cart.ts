"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CartDataType, CartItemDataType } from "@repo/schemas";
import {
  addCartItem,
  removeCartItem,
  updateCartItem,
} from "@/lib/queries/public/cart.query";
import { useGuestCart, type GuestCartItem } from "@/stores/cart.store";

interface UseCartOptions {
  /// Keranjang hasil render server. Hanya terisi untuk pengguna yang sudah login.
  serverCart?: CartDataType | null;
  isLoggedIn: boolean;
}

/// Bentuk item guest disamakan dengan item server supaya komponen keranjang
/// cukup punya satu jalur render.
function guestToCartItem(item: GuestCartItem): CartItemDataType {
  return {
    // Guest tidak punya id baris di database; id varian sudah unik per baris.
    id: item.productVariantId,
    productVariantId: item.productVariantId,
    productMasterId: item.snapshot.productMasterId,
    slug: item.snapshot.slug,
    sku: item.snapshot.sku,
    productName: item.snapshot.productName,
    productType: item.snapshot.productType,
    price: item.snapshot.price,
    image: item.snapshot.image,
    stock: item.snapshot.stock,
    quantity: item.quantity,
    options: item.snapshot.options,
    subtotal: String(Number(item.snapshot.price) * item.quantity),
  };
}

/**
 * Satu pintu untuk keranjang, apa pun status login-nya.
 *
 * Guest  → Zustand + localStorage, berubah seketika di client.
 * Login  → sumber kebenarannya server; setiap perubahan memanggil API lalu
 *          router.refresh() supaya halaman SSR ikut segar.
 */
export function useCart({ serverCart, isLoggedIn }: UseCartOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMutating, setIsMutating] = useState(false);

  const guestItems = useGuestCart((state) => state.items);
  const addGuestItem = useGuestCart((state) => state.addItem);
  const updateGuestQuantity = useGuestCart((state) => state.updateQuantity);
  const removeGuestItem = useGuestCart((state) => state.removeItem);

  // Isi localStorage belum ada saat render server, jadi tunggu mount dulu
  // supaya markup client dan server tidak berbeda.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const items = useMemo(() => {
    if (isLoggedIn) return serverCart?.items ?? [];
    return hydrated ? guestItems.map(guestToCartItem) : [];
  }, [isLoggedIn, serverCart, guestItems, hydrated]);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = items.reduce(
    (total, item) => total + Number(item.subtotal),
    0,
  );

  const run = useCallback(
    async (action: () => Promise<unknown>, errorTitle: string) => {
      setIsMutating(true);
      try {
        await action();
        startTransition(() => router.refresh());
      } catch (error) {
        toast.error(errorTitle, {
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        setIsMutating(false);
      }
    },
    [router],
  );

  const add = useCallback(
    async (item: GuestCartItem) => {
      if (!isLoggedIn) {
        addGuestItem(item);
        return;
      }

      await run(
        () =>
          addCartItem({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          }),
        "Gagal menambahkan ke keranjang",
      );
    },
    [isLoggedIn, addGuestItem, run],
  );

  const setQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!isLoggedIn) {
        updateGuestQuantity(itemId, quantity);
        return;
      }

      await run(
        () => updateCartItem(itemId, quantity),
        "Gagal mengubah jumlah",
      );
    },
    [isLoggedIn, updateGuestQuantity, run],
  );

  const remove = useCallback(
    async (itemId: string) => {
      if (!isLoggedIn) {
        removeGuestItem(itemId);
        return;
      }

      await run(() => removeCartItem(itemId), "Gagal menghapus item");
    },
    [isLoggedIn, removeGuestItem, run],
  );

  return {
    items,
    totalItems,
    totalAmount,
    add,
    setQuantity,
    remove,
    isBusy: isPending || isMutating,
    hydrated: isLoggedIn || hydrated,
  };
}
