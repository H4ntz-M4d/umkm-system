"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import BlogForm from "@/components/management/blog/blog-form";
import CentralOnly from "@/components/management/central-only";

export default function Page() {
  return (
    <CentralOnly>
      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/management/blog" aria-label="Kembali ke daftar blog">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">Tulisan Baru</h1>
            <p className="text-sm text-muted-foreground">
              Simpan sebagai draf dulu kalau belum siap tayang.
            </p>
          </div>
        </div>

        <BlogForm />
        <Toaster />
      </main>
    </CentralOnly>
  );
}
