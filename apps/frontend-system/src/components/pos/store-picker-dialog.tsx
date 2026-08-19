"use client";

import { Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { usePosStoreSelection } from "@/stores/pos-store.store";

/**
 * Pemilih toko untuk Owner dan Admin, yang tidak terikat satu toko.
 *
 * Memblokir — tanpa tombol tutup dan tidak bisa ditutup dengan Escape atau klik
 * di luar — karena tanpa toko layar POS tidak punya isi yang sahih: daftar
 * produknya kosong dan setiap tombol bayar akan ditolak server. Lebih jujur
 * meminta di awal daripada membiarkan orang menekan tombol yang diam saja.
 */
/**
 * Jumlah item di keranjang, dibaca dari localStorage.
 *
 * Keranjang POS memang berumah di sana (`pos-view` menyinkronkannya setiap kali
 * berubah), jadi ini bukan jalan pintas melainkan sumber yang sama. Dipakai
 * hanya untuk memutuskan perlu-tidaknya peringatan.
 */
function countCartItems(): number {
  try {
    const saved = localStorage.getItem("pos_cart");
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function StorePickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { storeList } = useStoreOperations({ enableStoreList: true });
  const selectStore = usePosStoreSelection((state) => state.selectStore);
  const selectedStoreId = usePosStoreSelection(
    (state) => state.selectedStoreId,
  );

  /// Tanpa `onOpenChange`, dialog ini tidak bisa ditutup sama sekali — itulah
  /// yang diinginkan saat toko belum dipilih.
  const isDismissable = Boolean(onOpenChange);

  /// Hanya relevan saat mengganti toko; saat memilih pertama kali keranjang
  /// pasti masih kosong.
  const cartCount = open && selectedStoreId ? countCartItems() : 0;

  const handleSelect = (store: { id: string; name: string }) => {
    selectStore(store);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={isDismissable}
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => !isDismissable && event.preventDefault()}
        onInteractOutside={(event) => !isDismissable && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Pilih toko</DialogTitle>
          <DialogDescription>
            Akun Anda tidak terikat pada satu toko. Pilih toko tempat Anda
            bertransaksi — stok dan penjualannya akan tercatat di toko itu.
          </DialogDescription>
        </DialogHeader>

        {cartCount > 0 && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Keranjang berisi {cartCount} item dan akan dikosongkan bila Anda
            berpindah toko, karena stok setiap toko berbeda.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {!storeList ? (
            <>
              <Skeleton className="h-11 w-full rounded-md" />
              <Skeleton className="h-11 w-full rounded-md" />
            </>
          ) : storeList.data.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada toko aktif. Hubungi admin untuk menambahkannya.
            </p>
          ) : (
            storeList.data.map((store) => (
              <Button
                key={store.id}
                variant={selectedStoreId === store.id ? "secondary" : "outline"}
                className="h-11 justify-start gap-2"
                onClick={() => handleSelect({ id: store.id, name: store.name })}
              >
                <Store className="size-4" />
                {store.name}
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
