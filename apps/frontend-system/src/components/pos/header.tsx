"use client";
import { ModeToggle } from "../theme-mode";
import { Badge } from "../ui/badge";

interface UserData {
  name: string;
  role: string;
}

export default function HeaderPos({ user }: { user: UserData }) {
  const initialName = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="py-2 px-6 sticky md:relative top-0 z-50 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="hidden bg-sidebar-primary text-sidebar-primary-foreground md:flex aspect-square size-9 items-center justify-center rounded-lg">
            <h1 className="group-data-[collapsible=icon]:mr-2 font-bold text-lg dark:text-white">
              N
            </h1>
          </div>
          <div className="flex flex-col text-left leading-tight">
            <h3 className="truncate font-bold text-lg">NurfaCraft POS</h3>
            <span className="truncate text-xs text-black/40 dark:text-white/60">
              UMKM Point of Sales
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
            <p className="text-black dark:text-white">
              {user.name} - {user.role}
            </p>
          </Badge>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
