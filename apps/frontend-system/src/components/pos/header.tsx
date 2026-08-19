"use client";
import { ListEnd, LogOut, ShoppingCartIcon } from "lucide-react";
import { ModeToggle } from "../theme-mode";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { usePosUiStore } from "@/stores/pos-ui.store";
import { se } from "date-fns/locale";
import NavPos from "./nav-pos";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useAuth } from "@/stores/useAuth";
import { useState } from "react";
import { useActivePosStore } from "@/hooks/pos/use-active-store";
import StorePickerDialog from "./store-picker-dialog";

export default function HeaderPos() {
  const user = useAuth((s) => s.user);
  const { storeName, isLocked, isReady, needsSelection } = useActivePosStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const initialName = user?.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const role = user
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLocaleLowerCase()
    : "";

  const { setOrderProcessOpen, setOrderQueueOpen } = usePosUiStore();
  const { signOutAdmin } = useAuthOperations();

  return (
    <div className="py-2 px-6 sticky md:relative top-0 z-50 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden bg-sidebar-primary text-sidebar-primary-foreground md:flex aspect-square size-9 items-center justify-center rounded-lg">
            <h1 className="group-data-[collapsible=icon]:mr-2 font-bold text-lg dark:text-white">
              N
            </h1>
          </div>
          <div className="w-35 md:w-full flex flex-col text-left leading-tight">
            <h3 className="truncate font-bold text-lg">NurfaCraft POS</h3>
            <span className="flex items-center gap-1.5 truncate text-xs text-black/40 dark:text-white/60">
              {/* Sebelumnya selalu menulis `user.storeName`, yang terbaca
                  "Toko undefined" bagi Owner dan Admin karena akun mereka
                  memang tidak terikat toko. */}
              {storeName ? `Toko ${storeName} -` : ""} UMKM Point of Sales
              {isReady && !isLocked && (
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {storeName ? "Ganti" : "Pilih toko"}
                </button>
              )}
            </span>
          </div>
        </div>
        <div className="flex justify-center items-center gap-3">
          <Badge
            variant={"outline"}
            className="text-white py-2 px-4 space-x-1 hidden md:flex"
          >
            <div className="rounded-full size-7 flex items-center justify-center bg-primary">
              <h3 className="font-bold">{initialName}</h3>
            </div>
            <p className="text-black text-[14px] dark:text-white">
              {user?.name} - {role}
            </p>
          </Badge>
          <div className="hidden md:flex">
            <ModeToggle />
          </div>
          <Button
            className="block md:hidden"
            type="button"
            variant={"secondary"}
            onClick={() => setOrderProcessOpen(true)}
          >
            <ShoppingCartIcon />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="block lg:hidden"
                type="button"
                variant={"outline"}
                onClick={() => setOrderQueueOpen(true)}
              >
                <ListEnd />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Antrian</TooltipContent>
          </Tooltip>
          <div className="flex md:hidden">
            <NavPos />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="hidden md:flex"
                variant="destructive"
                onClick={() => {
                  signOutAdmin();
                }}
              >
                <LogOut />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keluar dari akun</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Saat toko belum dipilih, dialog dibuka paksa dan tidak bisa ditutup —
          karena itu `onOpenChange` sengaja tidak diberikan pada kondisi itu. */}
      <StorePickerDialog
        open={needsSelection || isPickerOpen}
        onOpenChange={needsSelection ? undefined : setIsPickerOpen}
      />
    </div>
  );
}
