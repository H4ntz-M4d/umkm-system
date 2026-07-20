import { Header } from "@/components/management/header";
import { ManagementProvider } from "@/components/providers/management-provider";
import { ReactNode } from "react";
import { getAdminProfile } from "@/lib/queries/auth/auth.api";
import { cookies, headers } from "next/headers";
import { useAuth } from "@/stores/useAuth";
import HeaderPos from "@/components/pos/header";
import PosProvider from "@/components/providers/pos-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

interface PosLayoutProps {
  children: ReactNode;
}

interface UserData {
  name: string;
  role: string;
}

export default async function PosLayout({ children }: PosLayoutProps) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    headerStore.get("x-access-token-admin") ||
    cookieStore.get("access_token_admin")?.value;

  if (!token) return null;

  let user = null;

  if (token) {
    try {
      user = await getAdminProfile(token);
    } catch (err) {}
  }

  return (
    <>
      <PosProvider user={user}>
        <TooltipProvider>
          <HeaderPos />
        </TooltipProvider>

        {children}
      </PosProvider>
    </>
  );
}
