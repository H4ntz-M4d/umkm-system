"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InputGroupInlineStart } from "@/components/ui/search";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOG_STATUS_LABEL, columnsBlog } from "./blog-column";
import { DataTableBlog } from "./blog-data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useBlogOperation } from "@/hooks/management/blog/use-blog-operation";
import { BlogFilters } from "@/lib/queries/blog/blog.query";

interface BlogViewProps {
  filters: BlogFilters;
}

export default function BlogView({ filters }: BlogViewProps) {
  const { pagination, onPaginationChange } = usePaginationParams();
  const router = useRouter();
  const pathName = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(filters.search ?? "");
  const debouncedSearch = useDebounce(search, 500);

  const { blogList, isBlogListLoading, blogCategories, removeBlogData } =
    useBlogOperation({
      enableList: true,
      enableCategories: true,
      filters: {
        ...filters,
        page: pagination.pageIndex,
        limit: pagination.pageSize,
        search: debouncedSearch,
      },
    });

  const updateUrl = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }

    // Penyaring berubah berarti jumlah halaman berubah; kembali ke halaman 1
    // supaya tidak mendarat di halaman kosong.
    next.delete("page");
    router.push(`${pathName}?${next.toString()}`, { scroll: false });
  };

  const pageCount = blogList?.total
    ? Math.ceil(blogList.total / pagination.pageSize)
    : 1;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <InputGroupInlineStart
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari judul tulisan..."
        />

        <Select
          value={filters.status || "none"}
          onValueChange={(value) =>
            updateUrl({ status: value === "none" ? undefined : value })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="none">Semua Status</SelectItem>
              {Object.entries(BLOG_STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId || "none"}
          onValueChange={(value) =>
            updateUrl({ categoryId: value === "none" ? undefined : value })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="none">Semua Kategori</SelectItem>
              {blogCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl bg-muted/50 md:min-h-min">
        <DataTableBlog
          columns={columnsBlog((id) => removeBlogData({ id }))}
          data={blogList?.data ?? []}
          isLoading={isBlogListLoading}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      </div>
    </>
  );
}
