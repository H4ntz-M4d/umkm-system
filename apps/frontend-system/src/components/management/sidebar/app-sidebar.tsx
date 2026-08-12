"use client";

import * as React from "react";
import {
  BaggageClaim,
  BanknoteArrowDown,
  Boxes,
  ChartLine,
  Grid2X2Plus,
  Handbag,
  Landmark,
  LayoutDashboard,
  PackageOpen,
  ScrollText,
  ShoppingBasketIcon,
  Store,
  TriangleAlert,
  Users,
} from "lucide-react";

import {
  NavMain,
  type NavItem,
} from "@/components/management/sidebar/nav-main";
import { NavUser } from "@/components/management/sidebar/nav-user";
import { Logo } from "@/components/management/sidebar/logo";
import { canAccessPath } from "@/lib/auth/route-access.config";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const data = {
  /// Dashboard dan POS berdiri di luar grup mana pun, di bagian paling atas.
  quickAccessItems: [
    {
      title: "Dashboard",
      url: "/management/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "POS",
      url: "/point-of-sale/system",
      icon: ScrollText,
    },
  ],
  masterItems: [
    {
      title: "Toko",
      url: "/management/stores",
      icon: Store,
    },
    {
      title: "User",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Karyawan",
          url: "/management/employee",
        },
        {
          title: "Pelanggan",
          url: "/management/customer",
        },
      ],
    },
    {
      title: "Kategori Produk",
      url: "/management/categories",
      icon: Grid2X2Plus,
    },
    {
      title: "Produk Rajutan",
      url: "/management/products",
      icon: ShoppingBasketIcon,
    },
  ],
  inventoryAndProductionItems: [
    {
      title: "Inventori",
      url: "/management/inventory-ledger",
      icon: Boxes,
    },
    {
      title: "Produksi",
      url: "/management/production",
      icon: PackageOpen,
    },
    {
      title: "Stok Rendah",
      url: "/management/low-stock",
      icon: TriangleAlert,
    },
  ],
  reportAndFinanceItems: [
    {
      title: "Metode Pembayaran",
      url: "/management/payment-method",
      icon: Landmark,
    },
    {
      title: "Pesanan Online dan Kasir",
      url: "/management/order-transaction",
      icon: BaggageClaim,
    },
    {
      title: "Alur Transakasi",
      url: "/management/transaction-flow",
      icon: BanknoteArrowDown,
    },
    {
      title: "Pengeluaran",
      url: "/management/expense",
      icon: Handbag,
    },
    {
      title: "Omzet",
      url: "#",
      icon: ChartLine,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: any;
  /// Diambil dari token oleh layout, bukan dari `user`, supaya menu tetap utuh
  /// meski pemuatan profil gagal.
  role?: string;
}

/**
 * Menyembunyikan menu yang tidak boleh dibuka role ini. Aturannya diambil dari
 * `route-access.config`, sumber yang sama dengan penjagaan URL di `proxy.ts`,
 * supaya menu yang tampil tidak pernah berbeda dari yang benar-benar bisa
 * dibuka.
 *
 * Menu bertingkat disaring pada anaknya; induknya ikut hilang begitu semua
 * anaknya tersaring, karena induk seperti "User" hanya wadah tanpa halaman
 * sendiri.
 */
function filterByRole(items: NavItem[], role?: string): NavItem[] {
  return items.flatMap((item) => {
    if (!item.items?.length) {
      return canAccessPath(item.url, role) ? [item] : [];
    }

    const subItems = item.items.filter((sub) => canAccessPath(sub.url, role));
    return subItems.length > 0 ? [{ ...item, items: subItems }] : [];
  });
}

export function AppSidebar({ user, role, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  const menu = React.useMemo(
    () => ({
      quickAccess: filterByRole(data.quickAccessItems, role),
      master: filterByRole(data.masterItems, role),
      inventoryAndProduction: filterByRole(
        data.inventoryAndProductionItems,
        role,
      ),
      reportAndFinance: filterByRole(data.reportAndFinanceItems, role),
    }),
    [role],
  );

  return (
    <Sidebar collapsible="icon" {...props} variant="sidebar">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {menu.quickAccess.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menu.quickAccess.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className="flex justify-center items-center"
                  >
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon />} <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <NavMain
          masterItems={menu.master}
          inventoryAndProductionItems={menu.inventoryAndProduction}
          reportAndFinanceItems={menu.reportAndFinance}
          pathname={pathname}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
