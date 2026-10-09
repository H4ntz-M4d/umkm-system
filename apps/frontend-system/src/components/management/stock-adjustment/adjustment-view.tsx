"use client";

import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { InputGroupInlineStart } from "@/components/ui/search";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/stores/useAuth";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useStockAdjustment } from "@/hooks/management/stock-adjustment/use-stock-adjustment";

export default function StockAdjustmentView() {
  const user = useAuth((state) => state.user);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [reason, setReason] = useState("");
  /// Hanya varian yang benar-benar diketik yang masuk sini. Kolom yang
  /// dibiarkan kosong berarti "tidak dihitung", bukan "nol".
  const [counted, setCounted] = useState<Record<string, string>>({});

  /**
   * Akun yang terikat toko langsung memakai tokonya sendiri; yang tidak
   * terikat harus memilih dulu — pola yang sama dengan POS, supaya tidak ada
   * penyesuaian yang tanpa sengaja mengenai toko lain.
   */
  const isLockedToStore = Boolean(user?.storeId);
  const [pickedStoreId, setPickedStoreId] = useState("");
  const activeStoreId = isLockedToStore ? user?.storeId : pickedStoreId;

  const { storeList } = useStoreOperations({
    enableStoreList: !isLockedToStore,
  });

  const { adjustmentData, isLoadingRows, applyAdjustmentData, isApplying } =
    useStockAdjustment({
      storeId: isLockedToStore ? undefined : pickedStoreId,
      search: debouncedSearch,
      enabled: Boolean(activeStoreId),
    });

  /// Baris yang angkanya berbeda dari stok sekarang — itulah yang akan
  /// dikirim, dan itu pula yang ditampilkan sebagai ringkasan.
  const rows = useMemo(() => adjustmentData?.rows ?? [], [adjustmentData]);

  const changes = useMemo(
    () =>
      rows
        .map((row) => {
          const raw = counted[row.productVariantId];
          if (raw === undefined || raw === "") return null;

          const value = Number(raw);
          if (!Number.isFinite(value) || value < 0) return null;
          if (value === row.stock) return null;

          return { row, value, difference: value - row.stock };
        })
        .filter((item) => item !== null),
    [rows, counted],
  );

  const canSubmit = changes.length > 0 && reason.trim().length >= 5;

  const submit = async () => {
    if (!canSubmit) return;

    try {
      await applyAdjustmentData({
        ...(isLockedToStore ? {} : { storeId: pickedStoreId }),
        reason: reason.trim(),
        items: changes.map((change) => ({
          productVariantId: change.row.productVariantId,
          countedStock: change.value,
        })),
      });
      setCounted({});
      setReason("");
    } catch {
      // Pesan galatnya sudah ditampilkan mutation; isian dibiarkan supaya
      // hasil hitung fisik tidak hilang.
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="font-display text-xl font-bold">Penyesuaian Stok</h1>
        <p className="text-sm text-muted-foreground">
          Menyamakan stok di sistem dengan hasil hitung fisik — untuk stok awal,
          barang rusak, hilang, atau salah hitung.
        </p>
      </div>

      {!isLockedToStore && (
        <div className="max-w-sm space-y-1.5">
          <Label>Toko</Label>
          <Select value={pickedStoreId} onValueChange={setPickedStoreId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih toko dulu" />
            </SelectTrigger>
            <SelectContent>
              {(storeList?.data ?? []).map((store) => (
                <SelectItem key={store.id} value={String(store.id)}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!activeStoreId ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Pilih toko terlebih dahulu untuk melihat stoknya.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <InputGroupInlineStart
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama produk atau SKU..."
            />
            <p className="text-sm text-muted-foreground">
              Stok {adjustmentData?.storeName ?? "-"}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader className="bg-primary">
                <TableRow>
                  <TableHead className="text-white">Produk</TableHead>
                  <TableHead className="text-white">SKU</TableHead>
                  <TableHead className="text-center text-white">
                    Stok sistem
                  </TableHead>
                  <TableHead className="text-center text-white">
                    Terkunci pesanan
                  </TableHead>
                  <TableHead className="text-center text-white">
                    Hasil hitung
                  </TableHead>
                  <TableHead className="text-center text-white">
                    Selisih
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingRows ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Memuat stok...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tidak ada varian yang cocok.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const raw = counted[row.productVariantId] ?? "";
                    const value = Number(raw);
                    const hasValue = raw !== "" && Number.isFinite(value);
                    const difference = hasValue ? value - row.stock : 0;

                    return (
                      <TableRow
                        key={row.productVariantId}
                        className="bg-primary-foreground"
                      >
                        <TableCell>
                          <p className="font-medium">{row.productName}</p>
                          {row.variantLabel && (
                            <p className="text-xs text-muted-foreground">
                              {row.variantLabel}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.sku}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.stock}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {row.reservedStock}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            className="mx-auto w-24 text-center"
                            placeholder="—"
                            value={raw}
                            onChange={(event) =>
                              setCounted((current) => ({
                                ...current,
                                [row.productVariantId]: event.target.value,
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell
                          className={`text-center font-medium ${
                            difference > 0
                              ? "text-primary"
                              : difference < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {hasValue && difference !== 0
                            ? `${difference > 0 ? "+" : ""}${difference}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            <div className="space-y-1.5">
              <Label>Alasan penyesuaian</Label>
              <Textarea
                className="h-20"
                placeholder="Contoh: stok awal saat sistem mulai dipakai / 3 tas rusak terkena air / hasil opname 24 September"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Wajib diisi dan ikut tersimpan di riwayat — angka stok yang
                berubah tanpa keterangan tidak bisa ditelusuri lagi nanti.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {changes.length > 0
                  ? `${changes.length} varian akan disesuaikan`
                  : "Belum ada angka yang berubah"}
              </p>
              <Button
                className="gap-2"
                disabled={!canSubmit || isApplying}
                onClick={submit}
              >
                <Save className="h-4 w-4" />
                {isApplying ? "Menyimpan..." : "Simpan Penyesuaian"}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
