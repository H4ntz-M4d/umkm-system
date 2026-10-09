"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BatchForm from "@/components/management/production/batch-form";
import { Toaster } from "@/components/ui/sonner";

export default function Page() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <Link
          href="/management/production"
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Kembali ke daftar produksi
        </Link>
        <h1 className="font-display text-xl font-bold">Batch Produksi Baru</h1>
        <p className="text-sm text-muted-foreground">
          Batch dimulai berstatus Direncanakan. Statusnya bergerak sendiri
          mengikuti setoran yang dicatat nanti.
        </p>
      </div>

      <BatchForm />
      <Toaster />
    </main>
  );
}
