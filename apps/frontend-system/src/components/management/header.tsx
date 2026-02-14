"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";

export function Header() {
  const pathname = usePathname();

  // Memecah path menjadi array (contoh: /dashboard/stores/123 -> ["dashboard", "stores", "123"])
  const pathSegments = pathname.split("/").filter(Boolean);

  // Mapping manual untuk nama yang ingin dikustomisasi
  const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    stores: "Stores",
    settings: "Pengaturan",
    inventory: "Stok Barang",
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {pathSegments.map((segment, index) => {
              // Membuat URL path sampai ke segmen ini
              const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
              const isLast = index === pathSegments.length - 1;

              // Deteksi apakah segmen ini adalah ID (Angka saja atau UUID panjang)
              const isId = /^\d+$/.test(segment) || segment.length > 20;

              // Tentukan Label:
              // 1. Cek di routeLabels
              // 2. Jika ID, beri nama "Details"
              // 3. Jika tidak keduanya, format teks (kapital depan)
              let label =
                routeLabels[segment.toLowerCase()] ||
                (isId
                  ? "Details"
                  : segment.charAt(0).toUpperCase() +
                    segment.slice(1).replace(/-/g, " "));

              return (
                <React.Fragment key={href}>
                  <BreadcrumbItem
                    className={index === 0 ? "hidden md:block" : ""}
                  >
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={href}
                        className={index === 0 ? "font-bold text-xl" : ""}
                      >
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
