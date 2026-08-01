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
    label: "Home",
    path: "/",
  },
  {
    label: "Products",
    path: "/products",
  },
  // {
  //   label: "Blog",
  //   path: "/blog",
  // },
  // {
  //   label: "About",
  //   path: "/about",
  // },
];

export const NavItemProfile = (
  signOutCustomer: UseMutateFunction,
): navLink[] => [
  {
    label: "Profil",
    path: "/profile",
  },
  {
    label: "Wishlist",
    path: "/wishlist",
  },
  {
    label: "Shopping History",
    path: "/orders",
  },
  {
    label: "Logout",
    path: "#",
    fn: () => {
      signOutCustomer();
    },
  },
];
