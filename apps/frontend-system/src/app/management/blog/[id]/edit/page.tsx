"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import BlogForm from "@/components/management/blog/blog-form";
import { useBlogOperation } from "@/hooks/management/blog/use-blog-operation";
import CentralOnly from "@/components/management/central-only";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { blogDetail, isBlogDetailLoading } = useBlogOperation({
    blogId: id,
    enableDetail: true,
  });

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
            <h1 className="font-display text-xl font-bold">Ubah Tulisan</h1>
            <p className="text-sm text-muted-foreground">
              {blogDetail?.title ?? "Memuat tulisan..."}
            </p>
          </div>
        </div>

        {/* Form baru dipasang setelah datanya tiba supaya isiannya tidak
            dimulai dari keadaan kosong lalu berkedip berubah. */}
        {isBlogDetailLoading || !blogDetail ? (
          <p className="text-sm text-muted-foreground">Memuat tulisan...</p>
        ) : (
          <BlogForm initialData={blogDetail} />
        )}

        <Toaster />
      </main>
    </CentralOnly>
  );
}
