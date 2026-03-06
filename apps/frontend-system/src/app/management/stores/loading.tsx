// app/dashboard/store/loading.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      {/* Skeleton Header */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Skeleton Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="h-12 bg-muted border-b" /> {/* Table Header */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="h-16 border-b flex items-center px-4 space-x-4" key={index}>
            <Skeleton className="h-4 bg-muted w-12" />
            <Skeleton className="h-4 bg-muted w-full" />
            <Skeleton className="h-4 bg-muted w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
