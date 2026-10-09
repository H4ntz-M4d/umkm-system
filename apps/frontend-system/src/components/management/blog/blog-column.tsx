"use client";

import Link from "next/link";
import Image from "next/image";
import { ColumnDef } from "@tanstack/react-table";
import { BlogListItemDataType } from "@repo/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayjs } from "@repo/utils";
import { ImageIcon } from "lucide-react";

export const BLOG_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draf",
  PUBLISHED: "Terbit",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border border-border",
  PUBLISHED: "bg-primary/10 text-primary border border-primary",
};

export const columnsBlog = (
  onDelete: (id: string) => void,
): ColumnDef<BlogListItemDataType>[] => [
  {
    accessorKey: "title",
    header: "Tulisan",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 text-left">
        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
          {row.original.coverImage ? (
            <Image
              src={row.original.coverImage}
              alt={row.original.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{row.original.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            /blog/{row.original.slug}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "categoryName",
    header: "Kategori",
    cell: ({ row }) => <p>{row.original.categoryName ?? "Tanpa kategori"}</p>,
  },
  {
    accessorKey: "keywords",
    header: "Tag",
    /// Ditampilkan tiga saja; sisanya cukup dihitung, supaya satu baris tabel
    /// tidak melar hanya karena tulisannya bertag banyak.
    cell: ({ row }) => {
      const tags = row.original.keywords;
      if (tags.length === 0)
        return <span className="text-muted-foreground">—</span>;

      return (
        <div className="flex flex-wrap justify-center gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "authorName",
    header: "Penulis",
    cell: ({ row }) => <p>{row.original.authorName ?? "-"}</p>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={STATUS_STYLE[row.original.status]}>
        {BLOG_STATUS_LABEL[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "publishedAt",
    header: "Tayang",
    /// Draf belum punya tanggal tayang, dan itu memang bedanya dengan yang
    /// sudah terbit — jadi ditulis apa adanya, bukan diisi tanggal dibuat.
    cell: ({ row }) =>
      row.original.publishedAt ? (
        <p>
          {dayjs(row.original.publishedAt).locale("id").format("DD MMM YYYY")}
        </p>
      ) : (
        <p className="text-muted-foreground">Belum tayang</p>
      ),
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        {row.original.status === "PUBLISHED" && (
          <Button variant="ghost" asChild>
            <Link href={`/blog/${row.original.slug}`} target="_blank">
              Lihat
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/management/blog/${row.original.id}/edit`}>Ubah</Link>
        </Button>
        <Button variant="destructive" onClick={() => onDelete(row.original.id)}>
          Hapus
        </Button>
      </div>
    ),
  },
];
