import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchCart } from "@/lib/queries/public/cart.query";
import { fetchAddresses } from "@/lib/queries/public/address.query";
import CheckoutView from "@/components/public/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout | NurfaCraft",
};

export default async function Page() {
  // proxy.ts sudah menjaga rute ini untuk guest; ini jaring pengaman kalau
  // cookie kedaluwarsa di tengah jalan.
  const token = await getCustomerToken();
  if (!token) redirect("/login");

  const [cart, addresses] = await Promise.all([
    fetchCart(token).catch(() => null),
    fetchAddresses(token).catch(() => null),
  ]);

  // Checkout tanpa isi keranjang tidak ada artinya — kembalikan ke keranjang.
  if (!cart || cart.data.items.length === 0) redirect("/cart");

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Checkout
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Pastikan alamat pengiriman sudah benar sebelum membayar
        </p>
      </div>

      <CheckoutView cart={cart.data} addresses={addresses?.data ?? []} />
    </main>
  );
}
