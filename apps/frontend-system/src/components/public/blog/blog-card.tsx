import Link from "next/link";
import Image from "next/image";
import { BlogListItemDataType } from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { ImageIcon } from "lucide-react";

/// Server Component: kartu tulisan di daftar blog.
export default function BlogCard({ blog }: { blog: BlogListItemDataType }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/blog/${blog.slug}`} className="block">
        <div className="relative aspect-video bg-muted">
          {blog.coverImage ? (
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {blog.categoryName && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                {blog.categoryName}
              </span>
            )}
            {blog.publishedAt && (
              <time dateTime={blog.publishedAt}>
                {dayjs(blog.publishedAt).locale("id").format("DD MMMM YYYY")}
              </time>
            )}
          </div>

          <h2 className="font-display line-clamp-2 text-lg font-semibold text-foreground">
            {blog.title}
          </h2>

          {blog.excerpt && (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {blog.excerpt}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
