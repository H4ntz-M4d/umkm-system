import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Isi keranjang milik pengunjung yang belum login.
 *
 * `snapshot` hanya untuk keperluan tampilan supaya halaman keranjang guest tidak
 * perlu memanggil API per item. Harga yang dipakai saat checkout SELALU diambil
 * ulang dari server, jadi snapshot basi tidak berbahaya.
 */
export type GuestCartItem = {
  productVariantId: string;
  quantity: number;
  snapshot: {
    productMasterId: string;
    slug: string;
    productName: string;
    sku: string;
    price: string;
    image: string | null;
    options: Record<string, string>;
    stock: number;
  };
};

type CartState = {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  updateQuantity: (productVariantId: string, quantity: number) => void;
  removeItem: (productVariantId: string) => void;
  clear: () => void;
};

export const useGuestCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (current) => current.productVariantId === item.productVariantId,
          );

          if (!existing) return { items: [...state.items, item] };

          // Varian yang sama ditambah, bukan digandakan jadi baris baru.
          return {
            items: state.items.map((current) =>
              current.productVariantId === item.productVariantId
                ? {
                    ...current,
                    snapshot: item.snapshot,
                    quantity: Math.min(
                      item.snapshot.stock,
                      current.quantity + item.quantity,
                    ),
                  }
                : current,
            ),
          };
        }),

      updateQuantity: (productVariantId, quantity) =>
        set((state) => ({
          items: state.items.map((current) =>
            current.productVariantId === productVariantId
              ? {
                  ...current,
                  quantity: Math.max(
                    1,
                    Math.min(current.snapshot.stock, quantity),
                  ),
                }
              : current,
          ),
        })),

      removeItem: (productVariantId) =>
        set((state) => ({
          items: state.items.filter(
            (current) => current.productVariantId !== productVariantId,
          ),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "nurfa-guest-cart" },
  ),
);
