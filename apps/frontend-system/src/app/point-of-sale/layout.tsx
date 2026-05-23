import { Header } from "@/components/management/header";
import { ManagementProvider } from "@/components/providers/management-provider";
import { ReactNode } from "react";
import { getAdminProfile } from "@/lib/queries/auth/auth.api";
import { cookies, headers } from "next/headers";
import { useAuth } from "@/lib/queries/auth/useAuth";
import HeaderPos from "@/components/pos/header";

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
  const userPosData: UserData = {
    name: "",
    role: "",
  };

  if (token) {
    try {
      user = await getAdminProfile(token);
      userPosData.name = user.name;
      userPosData.role =
        user.role.charAt(0).toUpperCase() +
        user.role.slice(1).toLocaleLowerCase();
    } catch (err) {}
  }
  return (
    <>
      <ManagementProvider>
        <HeaderPos user={userPosData} />

        {children}
      </ManagementProvider>
    </>
  );
}
