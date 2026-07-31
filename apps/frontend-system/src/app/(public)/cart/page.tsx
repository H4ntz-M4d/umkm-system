import type { Metadata } from "next";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchCart } from "@/lib/queries/public/cart.query";
import CartView from "@/components/public/cart/cart-view";

export const metadata: Metadata = {
  title: "Keranjang | NurfaCraft",
};

export default async function Page() {
  // Guest tetap boleh membuka halaman ini — keranjangnya ada di localStorage dan
  // dibaca komponen client, jadi tidak ada yang perlu diambil dari server.
  const token = await getCustomerToken();
  const cart = token ? await fetchCart(token).catch(() => null) : null;

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Keranjang
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Periksa kembali pesananmu sebelum lanjut ke pembayaran
        </p>
      </div>

      <CartView serverCart={cart?.data ?? null} isLoggedIn={Boolean(token)} />
    </main>
  );
}
