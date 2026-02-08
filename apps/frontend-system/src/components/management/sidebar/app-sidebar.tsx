"use client"

import * as React from "react"
import {
  BaggageClaim,
  BanknoteArrowDown,
  Boxes,
  ChartLine,
  CirclePileIcon,
  Handbag,
  LayoutDashboard,
  PackageOpen,
  ScrollText,
  ShoppingBasketIcon,
  Store,
  Users,
} from "lucide-react"

import { NavMain } from "@/components/management/sidebar/nav-main"
import { NavUser } from "@/components/management/sidebar/nav-user"
import { Logo } from "@/components/management/sidebar/logo"
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
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
          url: "#",
        },
        {
          title: "Pelanggan",
          url: "#",
        }
      ],
    },
    {
      title: "Bahan Baku",
      url: "#",
      icon: CirclePileIcon,
    },
    {
      title: "Produk Rajutan",
      url: "#",
      icon: ShoppingBasketIcon
    },
  ],
  inventoryAndProductionItems: [
    {
      title: "Inventori",
      url: "#",
      icon: Boxes,
    },
    {
      title: "Produksi",
      url: "#",
      icon: PackageOpen
    },
  ],
  reportAndFinanceItems: [
    {
      title: "Pesanan",
      url: "#",
      icon: BaggageClaim
    },
    {
      title: "Transakasi",
      url: "#",
      icon: BanknoteArrowDown
    },
    {
      title: "Pengeluaran",
      url: "#",
      icon: Handbag
    },
    {
      title: "Omzet",
      url: "#",
      icon: ChartLine
    },
  ],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  return (
    <Sidebar collapsible="icon" {...props} variant="floating">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className="flex justify-center items-center">
                <SidebarMenuButton asChild isActive={pathname === '/management/dashboard'} tooltip={'Dashboard'}>
                  <Link href={'/management/dashboard'}>
                    <LayoutDashboard /> <span>Dashboard</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="flex justify-center items-center">
                <SidebarMenuButton asChild isActive={pathname === '/management/pos'} tooltip={'Point of Sale'}>
                  <Link href={'/management/point-of-sale'}>
                    <ScrollText /> <span>POS</span></Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavMain masterItems={data.masterItems} inventoryAndProductionItems={data.inventoryAndProductionItems} reportAndFinanceItems={data.reportAndFinanceItems} pathname={pathname}/>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
