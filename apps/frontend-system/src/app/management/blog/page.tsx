"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FolderTree, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import BlogView from "@/components/management/blog/blog-view";
import BlogCategoryDialog from "@/components/management/blog/blog-category-dialog";
import { BlogFilters } from "@/lib/queries/blog/blog.query";
import { BlogStatusInput } from "@repo/schemas";
import CentralOnly from "@/components/management/central-only";

export default function Page() {
  const searchParams = useSearchParams();
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const filters: BlogFilters = {
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as BlogStatusInput) || "",
    categoryId: searchParams.get("categoryId") || "",
  };

  return (
    <CentralOnly>
      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold">Blog</h1>
            <p className="text-sm text-muted-foreground">
              Tulisan yang tampil di halaman publik Nurfa Craft.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsCategoryOpen(true)}
            >
              <FolderTree className="h-4 w-4" />
              Kategori
            </Button>
            <Button className="gap-2" asChild>
              <Link href="/management/blog/new">
                <Plus className="h-4 w-4" />
                Tulisan Baru
              </Link>
            </Button>
          </div>
        </div>

        <BlogView filters={filters} />

        <BlogCategoryDialog
          open={isCategoryOpen}
          onOpenChange={setIsCategoryOpen}
        />
        <Toaster />
      </main>
    </CentralOnly>
  );
}
