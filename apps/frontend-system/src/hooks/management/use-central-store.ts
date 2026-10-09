import { useAuth } from "@/stores/useAuth";

/**
 * Apakah pengguna yang sedang login boleh mengelola data master.
 *
 * Syaratnya dua: perannya Owner atau Admin, DAN ia orang pusat (bertugas di
 * toko berpenanda rumah produksi, atau tidak terikat toko mana pun).
 *
 * Nilainya ikut aturan yang sama dengan `CentralStoreGuard` di server, jadi
 * tombol yang tampil di layar selalu sama dengan yang benar-benar diizinkan.
 */
export function useCanManageMaster() {
  const user = useAuth((state) => state.user);

  if (!user) return false;

  const isManager = user.role === "OWNER" || user.role === "ADMIN";
  return isManager && user.isCentralStore !== false;
}
