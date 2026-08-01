import { CustomerProvider } from "@/components/providers/customer-provider";
import Header from "@/components/public/navigation/header";
import { ReactNode } from "react";
import { getCustomerProfile } from "@/lib/queries/auth/auth.api";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchCart } from "@/lib/queries/public/cart.query";
import Footer from "@/components/public/navigation/footer";
import SnapScript from "@/components/public/checkout/snap-script";

interface PublicLayoutProps {
  children: ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const token = await getCustomerToken();

  // Keranjang guest hidup di localStorage dan dibaca komponen client, jadi di
  // sini cukup yang login saja. Kegagalan salah satu tidak boleh menjatuhkan
  // seluruh layout.
  const [user, cart] = await Promise.all([
    token ? getCustomerProfile(token).catch(() => null) : null,
    token ? fetchCart(token).catch(() => null) : null,
  ]);

  return (
    <>
      <CustomerProvider user={user ?? undefined}>
        <Header user={user} cart={cart?.data ?? null} />
        {children}
        <Footer />
        <SnapScript />
      </CustomerProvider>
    </>
  );
}
