import { Header } from "@/components/management/header";
import { AppSidebar } from "@/components/management/sidebar/app-sidebar";
import { ManagementProvider } from "@/components/providers/management-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { getAdminProfile } from "@/lib/queries/auth/auth.api";
import { cookies, headers } from "next/headers";
import { useAuth } from "@/stores/useAuth";
import { getRoleFromToken } from "@/lib/auth/token-role";

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
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Role dibaca dari token, bukan dari profil di atas, karena profilnya bisa
   * gagal dimuat saat backend sedang bermasalah. Kalau sidebar bergantung pada
   * profil, kegagalan itu membuat seluruh menu hilang padahal halamannya tetap
   * terbuka — `proxy.ts` sudah meloloskan pengguna berdasarkan token yang sama.
   */
  const role = getRoleFromToken(token);

  return (
    <>
      <ManagementProvider>
        <SidebarProvider>
          <AppSidebar user={user} role={role} />
          <SidebarInset className={"overflow-hidden"}>
            <Header />
            {children}
          </SidebarInset>
        </SidebarProvider>
      </ManagementProvider>
    </>
  );
}
