"use client";

import * as React from "react";
import {
  BaggageClaim,
  BanknoteArrowDown,
  Boxes,
  ChartLine,
  CirclePileIcon,
  Grid2X2,
  Grid2X2Plus,
  Handbag,
  Landmark,
  LayoutDashboard,
  PackageOpen,
  ScrollText,
  ShoppingBasketIcon,
  Store,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/management/sidebar/nav-main";
import { NavUser } from "@/components/management/sidebar/nav-user";
import { Logo } from "@/components/management/sidebar/logo";
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
import { useAuth } from "@/lib/queries/auth/useAuth";

// This is sample data.
const data = {
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
  ],
  reportAndFinanceItems: [
    {
      title: "Metode Pembayaran",
      url: "/management/payment-method",
      icon: Landmark,
    },
    {
      title: "Pesanan",
      url: "#",
      icon: BaggageClaim,
    },
    {
      title: "Transakasi",
      url: "#",
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
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props} variant="sidebar">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="flex justify-center items-center">
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/management/dashboard"}
                  tooltip={"Dashboard"}
                >
                  <Link href={"/management/dashboard"}>
                    <LayoutDashboard /> <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="flex justify-center items-center">
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/point-of-sale/system"}
                  tooltip={"Point of Sale"}
                >
                  <Link href={"/point-of-sale/system"}>
                    <ScrollText /> <span>POS</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavMain
          masterItems={data.masterItems}
          inventoryAndProductionItems={data.inventoryAndProductionItems}
          reportAndFinanceItems={data.reportAndFinanceItems}
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
