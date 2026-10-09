"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BespokeOrderDataType, BespokeStatusInput } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InputGroupInlineStart } from "@/components/ui/search";
import { DataTableExpense as DataTable } from "@/components/management/expense/expenses-table";
import {
  BESPOKE_STATUS_LABEL,
  columnsBespoke,
} from "@/components/management/bespoke/bespoke-column";
import { BespokeForm } from "@/components/management/bespoke/bespoke-form";
import { useBespokeOperation } from "@/hooks/management/bespoke/use-bespoke-operation";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useDebounce } from "@/hooks/use-debounce";
import { toIDR } from "../../../../utils/format-money";
import { useCanManageMaster } from "@/hooks/management/use-central-store";

const STATUS_FLOW: Record<string, BespokeStatusInput[]> = {
  PLANNED: ["IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
};

export default function BespokePage() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<BespokeOrderDataType | null>(null);
  const canManage = useCanManageMaster();

  const debouncedSearch = useDebounce(search, 500);

  const {
    bespokeData,
    bespokeSummary,
    updateBespokeStatusData,
    removeBespokeData,
  } = useBespokeOperation({
    filters: {
      page: pagination.pageIndex,
      limit: pagination.pageSize,
      search: debouncedSearch,
      status,
    },
  });

  const pageCount = bespokeData?.total
    ? Math.ceil(bespokeData.total / pagination.pageSize)
    : 1;

  const summary = bespokeSummary?.data;

  /**
   * Status berikutnya ditawarkan lewat prompt sederhana, bukan dialog sendiri:
   * pilihannya sedikit dan alurnya searah, jadi satu layar tambahan hanya
   * menambah langkah tanpa menambah kejelasan.
   */
  const handleChangeStatus = (row: BespokeOrderDataType) => {
    const options = STATUS_FLOW[row.status] ?? [];
    if (options.length === 0) return;

    const pilihan = window.prompt(
      `Ubah status ${row.code} menjadi:\n${options
        .map((option, index) => `${index + 1}. ${BESPOKE_STATUS_LABEL[option]}`)
        .join("\n")}\n\nKetik nomornya.`,
    );

    const index = Number(pilihan) - 1;
    const next = options[index];
    if (!next) return;

    updateBespokeStatusData({ id: row.id, status: next });
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">Pesanan Custom</h1>
          <p className="text-sm text-muted-foreground">
            Pesanan yang dibuat khusus untuk satu pembeli. Tidak menyentuh stok;
            uangnya tercatat sebagai kas masuk saat selesai.
          </p>
        </div>
        {canManage && (
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Pesanan Custom Baru
          </Button>
        )}
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Direncanakan", value: String(summary.planned) },
            { label: "Dikerjakan", value: String(summary.inProgress) },
            { label: "Selesai", value: String(summary.completed) },
            {
              label: "Nilai pesanan selesai",
              value: toIDR(summary.completedValue),
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-lg font-bold">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <InputGroupInlineStart
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nomor, judul, atau pemesan..."
        />
        <Select
          value={status || "all"}
          onValueChange={(value) => setStatus(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {Object.entries(BESPOKE_STATUS_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-muted/50 rounded-xl md:min-h-min">
        <DataTable
          columns={columnsBespoke(
            (row) => {
              setEditing(row);
              setIsFormOpen(true);
            },
            handleChangeStatus,
            removeBespokeData,
            canManage,
          )}
          data={bespokeData?.data ?? []}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      </div>

      <BespokeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        order={editing}
      />
      <Toaster />
    </main>
  );
}
