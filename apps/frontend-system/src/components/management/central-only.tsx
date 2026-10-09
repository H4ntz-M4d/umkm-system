"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanManageMaster } from "@/hooks/management/use-central-store";

/**
 * Menutup isi halaman untuk pengguna cabang.
 *
 * Menyembunyikan menu saja tidak cukup: alamatnya masih bisa diketik langsung.
 * Tanpa penutup ini, orang cabang akan mendarat di halaman yang seluruh
 * datanya gagal dimuat dengan pesan ditolak bertubi-tubi — terlihat seperti
 * kerusakan, padahal memang tidak boleh.
 *
 * Penjagaan yang mengikat tetap di server; ini soal menjelaskan, bukan
 * mengamankan.
 */
export default function CentralOnly({
  children,
  title = "Halaman ini hanya untuk pengelola pusat",
  description = "Data ini dikelola terpusat oleh Nurfa Craft Yogyakarta, bukan per cabang.",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const canManage = useCanManageMaster();

  if (canManage) return <>{children}</>;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" />
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" asChild className="mt-2">
        <Link href="/management/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </main>
  );
}
