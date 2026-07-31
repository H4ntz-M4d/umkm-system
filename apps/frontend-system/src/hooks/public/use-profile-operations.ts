"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CustomerProfileInput } from "@repo/schemas";
import { updateProfileCustomer } from "@/lib/queries/public/profile.query";

/**
 * Menyimpan profil customer lalu menyegarkan halaman.
 *
 * Profil dirender di server (layout mengambilnya lalu mengalirkannya ke store
 * lewat CustomerProvider), jadi setelah simpan perlu router.refresh() supaya
 * nama dan foto di header ikut berubah — bukan hanya di halaman ini.
 */
export function useProfileOperations() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(
    async (data: CustomerProfileInput, image?: File | null) => {
      setIsSaving(true);

      try {
        await updateProfileCustomer(data, image);
        toast.success("Profil berhasil disimpan");
        startTransition(() => router.refresh());
        return true;
      } catch (error) {
        toast.error("Gagal menyimpan profil", {
          description: error instanceof Error ? error.message : undefined,
        });
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [router],
  );

  return { save, isBusy: isSaving || isPending };
}
