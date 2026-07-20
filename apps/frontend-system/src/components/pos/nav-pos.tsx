import { useAuth } from "@/stores/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import { LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";
import NoProfileImg from "@/assets/no-profile-img.png";

export default function NavPos() {
  const user = useAuth((s) => s.user);
  const { setTheme, theme } = useTheme();
  const handleModeChange = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  const initialName = user?.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();
  const { signOutAdmin } = useAuthOperations();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"ghost"}
          className="rounded-full"
          size={"icon-lg"}
          type="button"
        >
          <Avatar size="lg">
            <AvatarImage src={NoProfileImg.src} />
            <AvatarFallback>{initialName}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] text-secondary">
            User
          </DropdownMenuLabel>
          <div className="px-2 pb-2">
            <h3 className="text-base font-bold">
              {user ? user.name : "Guest"}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {user ? user.email : "guest@example.com"}
            </p>
          </div>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className="text-[14px]">Profile</DropdownMenuItem>
          <div className="px-2 py-2 flex gap-4 justify-between items-center">
            <p className="text-[13px]">Dark Mode</p>
            <Switch value={theme} onCheckedChange={handleModeChange} />
          </div>
          <DropdownMenuSeparator />
        </DropdownMenuGroup>
        <DropdownMenuItem
          className="text-[13px]"
          variant="destructive"
          onClick={() => {
            signOutAdmin();
          }}
        >
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
