"use client";

import { useAuth } from "@/stores/useAuth";
import { usePosStoreSelection } from "@/stores/pos-store.store";

/**
 * Toko yang sedang berlaku di layar POS.
 *
 * Menyatukan dua asal yang berbeda supaya komponen POS tidak perlu tahu
 * bedanya: Kasir memperoleh tokonya dari akun dan tidak bisa menggantinya,
 * sedangkan Owner dan Admin memilih sendiri karena secara organisasi tidak
 * terikat satu toko.
 *
 * `isLocked` yang membedakan keduanya di UI — bukan peran — sehingga menambah
 * peran baru kelak tidak menuntut perubahan di sini.
 */
export function useActivePosStore() {
  const user = useAuth((state) => state.user);
  const selectedStoreId = usePosStoreSelection(
    (state) => state.selectedStoreId,
  );
  const selectedStoreName = usePosStoreSelection(
    (state) => state.selectedStoreName,
  );

  /**
   * Profil pengguna baru masuk ke store setelah render pertama — `PosProvider`
   * mengisinya di dalam `useEffect`. Sebelum itu `user` masih null, dan tanpa
   * penanda ini setiap Kasir akan melihat dialog "Pilih toko" berkedip muncul
   * lalu hilang, padahal tokonya sudah pasti.
   */
  const isReady = user !== null;

  const isLocked = Boolean(user?.storeId);

  const storeId = isLocked ? (user?.storeId ?? null) : selectedStoreId;
  const storeName = isLocked ? (user?.storeName ?? null) : selectedStoreName;

  return {
    storeId,
    storeName,
    /// Terkunci ke toko akun; tidak ada yang perlu dipilih maupun diganti.
    isLocked,
    isReady,
    /**
     * Belum ada toko yang berlaku. Selama ini benar, layar POS tidak bisa
     * menampilkan produk yang sahih dan setiap tombol bayar akan ditolak
     * server — jadi inilah yang memicu dialog pemilihan.
     */
    needsSelection: isReady && !isLocked && !selectedStoreId,
  };
}
