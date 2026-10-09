import type { Metadata } from "next";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchCart } from "@/lib/queries/public/cart.query";
import { fetchAddresses } from "@/lib/queries/public/address.query";
import CheckoutView from "@/components/public/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Ajukan Pesanan | NurfaCraft",
};

/**
 * Halaman pengajuan pesanan — dulu halaman checkout bayar-online.
 *
 * Tidak lagi menolak tamu. Sejak pembayaran pindah ke percakapan WhatsApp,
 * memaksa daftar/masuk lebih dulu berarti menghadang orang tepat di titik dia
 * belum tahu harga akhirnya — dan harga di katalog memang cuma gambaran.
 *
 * Keranjang tamu hidup di localStorage, jadi tidak ada yang bisa diambil di
 * server untuk mereka: `CheckoutView` yang menyatukan keduanya lewat
 * `useCart`. Karena itu halaman ini juga tidak lagi bisa mengalihkan keranjang
 * kosong ke `/cart` — pemeriksaannya ikut pindah ke sisi klien.
 */
export default async function Page() {
  const token = await getCustomerToken();

  const [cart, addresses] = token
    ? await Promise.all([
        fetchCart(token).catch(() => null),
        fetchAddresses(token).catch(() => null),
      ])
    : [null, null];

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Ajukan Pesanan
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Kirim rincian pesananmu, lalu lanjutkan obrolan di WhatsApp untuk
          harga dan DP-nya
        </p>
      </div>

      <CheckoutView
        serverCart={cart?.data ?? null}
        addresses={addresses?.data ?? []}
        isLoggedIn={Boolean(token)}
      />
    </main>
  );
}
