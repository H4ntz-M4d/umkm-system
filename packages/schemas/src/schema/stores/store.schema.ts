import z from "zod";

export const StoreSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  isActive: z.boolean().optional(),
  /**
   * Menandai toko yang stoknya dijual di storefront.
   *
   * Hanya boleh satu toko bertanda ini. Backend memindahkan penanda secara
   * otomatis saat toko lain dipilih, dan database menolak pelanggarannya lewat
   * partial unique index.
   */
  isOnlineSource: z.boolean().optional(),
})

export type StoreInput = z.infer<typeof StoreSchema>
