"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dipisah dari `app/not-found.tsx` supaya halaman 404-nya tetap Server
 * Component — hanya tombol ini yang butuh interaksi di sisi klien.
 *
 * Pemisahannya bukan sekadar kerapian: begitu `not-found.tsx` diberi
 * `"use client"`, ia berhenti berfungsi sebagai boundary untuk `notFound()`
 * dan penolakan role dari `src/proxy.ts` hanya menampilkan error shell Next,
 * bukan desain 404 ini. Tambahkan interaksi baru sebagai komponen klien
 * terpisah seperti ini, jangan dengan mengubah `not-found.tsx`.
 */
export function NotFoundBackButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => router.back()}
      className="gap-2"
    >
      <ArrowLeft className="size-4" />
      Halaman sebelumnya
    </Button>
  );
}
