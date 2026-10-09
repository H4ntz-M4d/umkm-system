import { create } from "zustand";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  /// Kosong untuk Owner dan Admin, yang secara organisasi tidak terikat satu
  /// toko — merekalah yang memilih toko sendiri saat memakai POS.
  storeId?: string | null;
  storeName?: string | null;
  /**
   * Apakah akun ini orang pusat — dihitung server, bukan ditebak layar.
   *
   * Dipakai menyembunyikan tombol tambah/ubah/hapus data master pada orang
   * cabang. Penjagaan sebenarnya tetap di server (`CentralStoreGuard`);
   * yang di sini hanya supaya tidak ada tombol yang menjanjikan sesuatu lalu
   * berakhir dengan pesan ditolak.
   */
  isCentralStore?: boolean;
};

type AuthState = {
  accessToken: string | null;
  user: AdminUser | null;
  setToken: (token: string | null) => void;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  logout: () => set({ accessToken: null, user: null }),
}));
