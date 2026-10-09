import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Mengubah judul jadi slug URL.
 *
 * Polanya mengikuti validasi di `BlogSchema`: huruf kecil, angka, dan tanda
 * hubung saja. Tanda baca dan huruf beraksen dibuang supaya slug yang
 * terbentuk otomatis tidak langsung ditolak server.
 */
export function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
