"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BatchForm from "@/components/management/production/batch-form";
import { Toaster } from "@/components/ui/sonner";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { productionDetail, isLoadingDetail } = useProductionOperation({
    productionId: id,
  });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <Link
          href={`/management/production/${id}`}
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Kembali ke detail batch
        </Link>
        <h1 className="font-display text-xl font-bold">
          Ubah Batch {productionDetail?.code ?? ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Varian yang sudah pernah disetor tidak bisa dihapus, dan targetnya
          tidak bisa diturunkan di bawah jumlah yang sudah masuk.
        </p>
      </div>

      {isLoadingDetail || !productionDetail ? (
        <p className="text-sm text-muted-foreground">Memuat batch...</p>
      ) : (
        <BatchForm initialData={productionDetail} />
      )}
      <Toaster />
    </main>
  );
}
