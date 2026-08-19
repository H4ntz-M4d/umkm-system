import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Toko yang sedang dipakai bertransaksi oleh pengguna yang tidak terikat satu
 * toko — yaitu Owner dan Admin.
 *
 * Kasir tidak memakai ini sama sekali: tokonya melekat pada akunnya dan
 * ditentukan server dari token. Yang tersimpan di sini murni kenyamanan, bukan
 * penentu kewenangan — backend memvalidasi ulang setiap pilihan lewat
 * `resolveTransactionStore`, jadi mengubah isi localStorage tidak memberi akses
 * apa pun.
 *
 * Dipersist karena sesi kasir berlangsung lama, dan menyegarkan halaman tidak
 * seharusnya memaksa memilih toko lagi.
 */
type PosStoreState = {
  selectedStoreId: string | null;
  selectedStoreName: string | null;
  selectStore: (store: { id: string; name: string } | null) => void;
};

export const usePosStoreSelection = create<PosStoreState>()(
  persist(
    (set) => ({
      selectedStoreId: null,
      selectedStoreName: null,
      selectStore: (store) =>
        set({
          selectedStoreId: store?.id ?? null,
          selectedStoreName: store?.name ?? null,
        }),
    }),
    { name: "pos-selected-store" },
  ),
);
