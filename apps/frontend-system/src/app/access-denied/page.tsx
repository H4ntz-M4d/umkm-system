import { notFound } from "next/navigation";

/**
 * Sasaran rewrite dari `src/proxy.ts` ketika role tidak berhak membuka sebuah
 * halaman manajemen.
 *
 * Perannya hanya memanggil `notFound()`. Cara ini dipilih daripada rewrite ke
 * path karangan karena statusnya dijamin 404 oleh Next, sementara URL yang
 * diketik pengguna tetap utuh di address bar.
 *
 * Yang tampil adalah halaman 404 biasa, bukan pesan "akses ditolak": tidak ada
 * gunanya memberi tahu bahwa halaman itu ada tapi tertutup bagi mereka.
 */
export default function AccessDeniedPage() {
  notFound();
}
