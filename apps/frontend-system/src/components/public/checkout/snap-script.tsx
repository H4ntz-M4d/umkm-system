import Script from "next/script";

/**
 * Memuat snap.js Midtrans. Client key memang dirancang untuk tampil di browser
 * (berbeda dari server key yang harus tetap di backend).
 *
 * Dipasang di layout (public) supaya halaman checkout maupun tombol "Bayar
 * Sekarang" di riwayat pesanan sama-sama bisa memakainya.
 */
export default function SnapScript() {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL;

  if (!clientKey || !snapUrl) return null;

  return <Script src={snapUrl} data-client-key={clientKey} strategy="afterInteractive" />;
}
