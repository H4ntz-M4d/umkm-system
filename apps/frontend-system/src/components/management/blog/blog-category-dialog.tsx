"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useBlogOperation } from "@/hooks/management/blog/use-blog-operation";
import { toSlug } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface BlogCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/// Isi dialog dipisah ke komponen sendiri dan hanya dipasang saat terbuka,
/// supaya isiannya bersih tiap kali dibuka tanpa perlu useEffect penyetel
/// ulang.
export default function BlogCategoryDialog({
  open,
  onOpenChange,
}: BlogCategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategori Blog</DialogTitle>
          <DialogDescription>
            Kategori dipakai pengunjung untuk menyaring tulisan di halaman blog.
          </DialogDescription>
        </DialogHeader>
        {open && <CategoryBody />}
      </DialogContent>
    </Dialog>
  );
}

function CategoryBody() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const {
    blogCategories,
    createBlogCategoryData,
    isCreateBlogCategoryData,
    removeBlogCategoryData,
  } = useBlogOperation({ enableCategories: true });

  const submit = () => {
    if (!name.trim()) return;
    createBlogCategoryData(
      { name: name.trim(), slug: slug.trim() || toSlug(name) },
      {
        onSuccess: () => {
          setName("");
          setSlug("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="flex-1">
          <FieldLabel>Nama kategori</FieldLabel>
          <Input
            placeholder="Tips Merawat Rajut"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSlug(toSlug(event.target.value));
            }}
          />
        </Field>
        <Field className="flex-1">
          <FieldLabel>Slug</FieldLabel>
          <Input
            placeholder="tips-merawat-rajut"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
        </Field>
        <Button
          type="button"
          onClick={submit}
          disabled={isCreateBlogCategoryData}
        >
          Tambah
        </Button>
      </div>

      <div className="divide-y rounded-md border">
        {blogCategories.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            Belum ada kategori.
          </p>
        )}
        {blogCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{category.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                /{category.slug} · {category.blogCount} tulisan
              </p>
            </div>
            {/* Kategori yang masih dipakai tidak menawarkan hapus; server pun
                menolaknya agar tulisan tidak kehilangan kategorinya diam-diam. */}
            {category.blogCount === 0 && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Hapus kategori ${category.name}`}
                onClick={() => removeBlogCategoryData({ id: category.id })}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
