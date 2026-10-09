"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function Logo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex justify-center items-center">
        <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-20 group-data-[collapsible=icon]:p-0!">
          <div className="flex aspect-square size-12 items-center justify-center rounded-lg">
            <Image
              src="/logo-mark.png"
              alt=""
              width={40}
              height={40}
              priority
              className="size-9 object-contain md:size-12 dark:hidden"
            />
            {/* Varian terang untuk mode gelap. Bukan filter `invert`: membalik
                          cokelat menghasilkan biru muda, yang bukan warna merek. */}
            <Image
              src="/logo-mark-light.png"
              alt=""
              width={40}
              height={40}
              priority
              className="hidden size-9 object-contain md:size-12 dark:block"
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold text-lg">Nurfa Craft</span>
            <span className="truncate text-xs">UMKM Dashboard</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
