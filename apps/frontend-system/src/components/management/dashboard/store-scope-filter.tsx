"use client";

import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/stores/useAuth";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";

/**
 * Pemilih toko untuk dashboard.
 *
 * Hanya muncul untuk akun yang TIDAK terikat toko. Akun cabang tidak
 * ditawari pilihan sama sekali: angka toko lain bukan urusan mereka, dan
 * servernya pun mengabaikan pilihan yang mereka kirim.
 *
 * "Semua toko" sengaja bukan bawaan. Cabang Nurfa Craft berdiri sendiri, jadi
 * angka gabungan menjumlahkan uang usaha lain ke dalam omzet sendiri — itu
 * boleh dilihat, tapi harus dipilih sadar.
 */
export default function StoreScopeFilter({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const user = useAuth((state) => state.user);
  const isBoundToStore = Boolean(user?.storeId);

  const { storeList } = useStoreOperations({
    enableStoreList: !isBoundToStore,
  });

  if (isBoundToStore) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="size-4" />
        {user?.storeName ?? "Toko Anda"}
      </p>
    );
  }

  return (
    <Select
      value={value || "default"}
      onValueChange={(next) => onValueChange(next === "default" ? "" : next)}
    >
      <SelectTrigger className="w-56">
        <Store className="size-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value="default">Toko Pusat</SelectItem>
        <SelectItem value="all">Semua Toko (gabungan)</SelectItem>
        {(storeList?.data ?? [])
          .filter((store) => !store.isProductionHouse)
          .map((store) => (
            <SelectItem key={store.id} value={String(store.id)}>
              {store.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
