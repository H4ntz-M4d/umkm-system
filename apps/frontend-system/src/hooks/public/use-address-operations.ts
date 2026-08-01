"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CustomerAddressSchemaInput } from "@repo/schemas";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/queries/public/address.query";

/**
 * Operasi buku alamat.
 *
 * Daftar alamat dirender di server, jadi setiap perubahan diikuti
 * router.refresh() — bukan menyimpan salinan daftar di state client yang lalu
 * harus disinkronkan sendiri.
 */
export function useAddressOperations() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isMutating, setIsMutating] = useState(false);

  const run = useCallback(
    async (
      action: () => Promise<unknown>,
      successMessage: string,
      errorTitle: string,
    ) => {
      setIsMutating(true);
      try {
        await action();
        toast.success(successMessage);
        startTransition(() => router.refresh());
        return true;
      } catch (error) {
        toast.error(errorTitle, {
          description: error instanceof Error ? error.message : undefined,
        });
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [router],
  );

  const create = useCallback(
    (data: CustomerAddressSchemaInput) =>
      run(() => createAddress(data), "Alamat ditambahkan", "Gagal menambah alamat"),
    [run],
  );

  const update = useCallback(
    (id: string, data: CustomerAddressSchemaInput) =>
      run(() => updateAddress(id, data), "Alamat diperbarui", "Gagal mengubah alamat"),
    [run],
  );

  const makeDefault = useCallback(
    (id: string) =>
      run(
        () => setDefaultAddress(id),
        "Alamat utama diperbarui",
        "Gagal mengubah alamat utama",
      ),
    [run],
  );

  const remove = useCallback(
    (id: string) =>
      run(() => deleteAddress(id), "Alamat dihapus", "Gagal menghapus alamat"),
    [run],
  );

  return { create, update, makeDefault, remove, isBusy: isMutating || isPending };
}
