import { Header } from "@/components/management/header";
import { AppSidebar } from "@/components/management/sidebar/app-sidebar";
import { ManagementProvider } from "@/components/providers/management-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { getAdminProfile } from "@/lib/queries/auth/auth.api";
import { cookies, headers } from "next/headers";
import { useAuth } from "@/lib/queries/auth/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
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
      <ManagementProvider>
        <SidebarProvider>
          <AppSidebar user={user} />
          <SidebarInset className={"overflow-hidden"}>
            <Header />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </ManagementProvider>
    </>
  );
}
