import { UseMutateFunction } from "@tanstack/react-query";

interface navLink {
  label: string;
  path: string;
  /// Item yang menjalankan aksi, bukan berpindah halaman. Kalau ada, `path`
  /// diabaikan dan item dirender sebagai tombol.
  fn?: () => void;
}

export const NavItem = (): navLink[] => [
  {
    label: "Beranda",
    path: "/",
  },
  {
    label: "Produk",
    path: "/products",
  },
  {
    label: "Blog",
    path: "/blog",
  },
  {
    label: "Tentang Kami",
    path: "/about",
  },
  {
    label: "Reseller",
    path: "/reseller",
  },
];

export const NavItemProfile = (
  signOutCustomer: UseMutateFunction,
): navLink[] => [
  {
    label: "Profil",
    path: "/profile",
  },
  {
    label: "Favorit",
    path: "/wishlist",
  },
  {
    label: "Riwayat Pesanan",
    path: "/orders",
  },
  {
    label: "Keluar",
    path: "#",
    fn: () => {
      signOutCustomer();
    },
  },
];
