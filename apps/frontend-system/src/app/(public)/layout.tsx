import { CustomerProvider } from "@/components/providers/customer-provider";
import Header from "@/components/public/navigation/header";
import { ReactNode } from "react";
import { cookies, headers } from "next/headers";
import { getCustomerProfile } from "@/lib/queries/auth/auth.api";
import { redirect } from "next/navigation";
import Footer from "@/components/public/navigation/footer";

interface PublicLayoutProps {
  children: ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const token =
    headerStore.get("x-access-token-customer") ||
    cookieStore.get("access_token_customer")?.value;

  let user = null;
  if (token) {
    try {
      user = await getCustomerProfile(token);
    } catch (error) {
      console.log("Ini error:", error);
    }
  }

  return (
    <>
      <CustomerProvider>
        <Header user={user} />
        {children}
        <Footer />
      </CustomerProvider>
    </>
  );
}
