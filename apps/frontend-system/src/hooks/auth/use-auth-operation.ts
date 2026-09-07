import {
  getAdminProfile,
  getCustomerProfile,
  loginAdmin,
  loginCustomer,
  logoutAdmin,
  logoutCustomer,
  registerCustomer,
} from "@/lib/queries/auth/auth.api";
import { mergeCart } from "@/lib/queries/public/cart.query";
import { useAuth } from "@/stores/useAuth";
import { useCustomerAuth } from "@/stores/userCustomerAuth";
import { useGuestCart } from "@/stores/cart.store";
import { usePosStoreSelection } from "@/stores/pos-store.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuthOperations = () => {
  const setTokenEmployee = useAuth((s) => s.setToken);
  const router = useRouter();

  const setTokenUser = useCustomerAuth((s) => s.setToken);

  const qc = useQueryClient();

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const loginAdminMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginAdmin(email, password),
    onSuccess: async (token) => {
      setTokenEmployee(token);
      localStorage.setItem("is_admin_logged_in", "true");
      qc.invalidateQueries({ queryKey: ["employee-profile"] });

      router.push("/management/dashboard");
    },
    // Halaman login memasang pesan yang lebih spesifik ("Email atau password
    // tidak valid") lewat opsi per-panggilan; ini jaring pengaman kalau
    // pemanggil lain lupa memasangnya.
    onError: showError("Gagal masuk"),
  });

  const loginCustomerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginCustomer(email, password),
    onError: showError("Email atau password tidak valid"),
    onSuccess: async (token) => {
      setTokenUser(token);
      localStorage.setItem("is_customer_logged_in", "true");
      qc.invalidateQueries({ queryKey: ["customer-profile"] });

      // Pindahkan keranjang guest ke server, lalu kosongkan yang lokal supaya
      // isinya tidak terhitung dua kali. Gagal menggabungkan tidak boleh
      // menggagalkan login — keranjang lokal sengaja dibiarkan utuh bila gagal.
      const guestItems = useGuestCart.getState().items;
      if (guestItems.length > 0) {
        try {
          await mergeCart(
            guestItems.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
            })),
          );
          useGuestCart.getState().clear();
        } catch (error) {
          toast.error("Sebagian keranjang gagal dipindahkan", {
            description: error instanceof Error ? error.message : undefined,
          });
        }
      }

      router.push("/");
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerCustomer,
    onSuccess: () => {
      toast.success(
        "Register Customer Berhasil, Silahkan login untuk melanjutkan",
        { position: "top-center" },
      );
      router.push("/login");
    },
    onError: showError("Gagal mendaftar"),
  });

  const logOutMutationAdmin = useMutation({
    mutationFn: async () => {
      return await logoutAdmin();
    },
    onError: showError("Gagal keluar"),
    onSuccess: () => {
      qc.clear();
      localStorage.removeItem("is_admin_logged_in");
      /**
       * Pilihan toko POS ikut dibuang.
       *
       * Kalau ditinggalkan, pengguna berikutnya di perangkat yang sama —
       * misalnya kasir yang bergantian shift di komputer kasir — akan mewarisi
       * toko pilihan orang sebelumnya. Untuk Kasir tidak berbahaya karena
       * tokonya tetap diambil dari token, tapi bagi Owner dan Admin itu berarti
       * bertransaksi di toko yang tidak pernah mereka pilih.
       *
       * Dibersihkan lewat API store-nya, bukan `removeItem` langsung: keluar
       * dari akun hanya berpindah halaman tanpa memuat ulang, jadi menghapus
       * localStorage saja akan menyisakan pilihan lama di memori Zustand.
       */
      usePosStoreSelection.getState().selectStore(null);
      /// Keranjang POS juga milik sesi sebelumnya, bukan milik siapa pun yang
      /// login berikutnya.
      localStorage.removeItem("pos_cart");
      router.push("/auth/management");
    },
  });

  const logOutMutationCustomer = useMutation({
    mutationFn: async () => {
      return await logoutCustomer();
    },
    onError: showError("Gagal keluar"),
    onSuccess: () => {
      qc.clear();
      localStorage.removeItem("is_customer_logged_in");
      router.refresh();
    },
  });

  return {
    loginAdminData: loginAdminMutation.mutate,
    isLoadingLoginAdmin: loginAdminMutation.isPending,
    loginCustomer: loginCustomerMutation.mutate,
    isLoadingLoginCustomer: loginCustomerMutation.isPending,

    registerCustomerData: registerMutation.mutate,
    signOutAdmin: logOutMutationAdmin.mutate,
    signOutCustomer: logOutMutationCustomer.mutate,
  };
};
