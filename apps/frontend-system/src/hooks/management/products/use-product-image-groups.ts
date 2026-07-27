"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EMPTY_IMAGE_GROUP_SIGNATURE,
  signatureForOptions,
  signatureLabel,
} from "@repo/schemas";

/** Satu grup gambar: kombinasi nilai variant dari tipe yang ditandai visual. */
export interface VisualGroup {
  signature: string;
  label: string;
}

interface UseProductImageGroupsInput {
  variantTypes:
    | { name: string; values: string[]; isHaveVisual?: boolean }[]
    | undefined;
  variants: { options?: Record<string, string> }[] | undefined;
  useVariant: boolean;
  /** imageGroups dari GET detail produk. Kosong saat membuat produk baru. */
  savedGroups: { signature: string; images: { image: string }[] }[] | undefined;
}

/**
 * Mengelola foto per grup visual pada form produk.
 *
 * Dua hal yang ditanggung hook ini dan mudah salah kalau ditulis ulang:
 *
 * 1. **Berkunci signature, bukan indeks.** File menempel pada kombinasi nilai
 *    visualnya, jadi regenerate kombinasi atau menghapus variant tidak bisa
 *    menggeser foto ke target yang salah.
 * 2. **Blob URL dicabut.** Setiap preview lokal dibuat dengan createObjectURL,
 *    dan wajib di-revoke saat diganti maupun saat unmount, kalau tidak bocor.
 *
 * visualGroups diturunkan dari variant yang BENAR-BENAR ada, memakai
 * signatureForOptions yang sama persis dengan sync() di backend. Dengan begitu
 * jumlah picker dijamin selalu sama dengan jumlah grup yang akan terbentuk, dan
 * tidak ada picker yang menerima file lalu membuangnya diam-diam.
 */
export function useProductImageGroups({
  variantTypes,
  variants,
  useVariant,
  savedGroups,
}: UseProductImageGroupsInput) {
  const [groupFiles, setGroupFiles] = useState<Record<string, File>>({});
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  // Blob URL yang kita buat sendiri, supaya bisa dicabut dan tidak bocor.
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const visualGroups = useMemo<VisualGroup[]>(() => {
    const visualTypeNames = new Set(
      (variantTypes ?? [])
        .filter((type) => type.isHaveVisual && type.values.length > 0)
        .map((type) => type.name.trim()),
    );

    if (!useVariant || visualTypeNames.size === 0) {
      return [{ signature: EMPTY_IMAGE_GROUP_SIGNATURE, label: "Foto Produk" }];
    }

    const groups = new Map<string, string>();
    for (const variant of variants ?? []) {
      const signature = signatureForOptions(
        variant.options ?? {},
        visualTypeNames,
      );
      if (!groups.has(signature)) {
        groups.set(signature, signatureLabel(signature));
      }
    }

    return [...groups].map(([signature, label]) => ({ signature, label }));
  }, [variantTypes, variants, useVariant]);

  // Gambar yang sudah tersimpan di server, diturunkan langsung dari data.
  const savedPreviews = useMemo(
    () =>
      Object.fromEntries(
        (savedGroups ?? [])
          .filter((group) => group.images[0])
          .map((group) => [group.signature, group.images[0]!.image]),
      ),
    [savedGroups],
  );

  const previewFor = useCallback(
    (signature: string): string | undefined =>
      localPreviews[signature] ?? savedPreviews[signature],
    [localPreviews, savedPreviews],
  );

  /** Cabut satu blob URL bila memang kita yang membuatnya. */
  const revokeLocal = (url: string | undefined) => {
    if (url && objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  };

  const setGroupImage = useCallback((signature: string, file: File) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);

    setGroupFiles((prev) => ({ ...prev, [signature]: file }));
    setLocalPreviews((prev) => {
      revokeLocal(prev[signature]);
      return { ...prev, [signature]: url };
    });
  }, []);

  /** Batalkan pilihan file yang belum diunggah. Gambar tersimpan tetap dipakai. */
  const clearGroupImage = useCallback((signature: string) => {
    setGroupFiles((prev) => {
      const next = { ...prev };
      delete next[signature];
      return next;
    });
    setLocalPreviews((prev) => {
      revokeLocal(prev[signature]);
      const next = { ...prev };
      delete next[signature];
      return next;
    });
  }, []);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  return {
    visualGroups,
    groupFiles,
    previewFor,
    setGroupImage,
    clearGroupImage,
  };
}
