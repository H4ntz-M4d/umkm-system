import { logoutCustomer } from "@/lib/queries/auth/auth.api";

interface navLink {
  label: string;
  path: string;
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
  {
    label: "Blog",
    path: "/blog",
  },
  {
    label: "About",
    path: "/about",
  },
];

export const NavItemProfile = (): navLink[] => [
  {
    label: "Settings",
    path: "#",
  },
  {
    label: "Shopping History",
    path: "#",
  },
  {
    label: "Logout",
    path: "#",
    fn: () => {
      logoutCustomer();
    },
  },
];
