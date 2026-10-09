import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";

export const BeSpokeSchema = z.object({
  name: z.string().optional(),
  email: z.email("Format email tidak valid").or(z.literal("")).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  quotedPrice: z.number({ message: "Harga usulan wajib diisi" }).optional(),
});

export const BeSpokeRequiredSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal memiliki panjang 3 karakter"),
  email: z.email("Format email tidak valid"),
  phone: z.string().trim().min(10, "Nomor minimal memiliki panjang 10 karakter"),
  title: z.string().trim().min(3, "Title minimal memiliki panjang 3 karakter"),
  description: z.string().optional(),
  quotedPrice: z.number({ message: "Harga usulan wajib diisi" }),
});

export type BeSpokeSchemaInput = z.infer<typeof BeSpokeSchema>;
export type BeSpokeRequiredSchemaInput = z.infer<typeof BeSpokeRequiredSchema>;

/// Status pengerjaan pesanan custom. Sama bentuknya dengan status produksi,
/// tapi enum sendiri: keduanya bebas berubah tanpa saling mengunci.
export const BespokeStatus = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export type BespokeStatusInput = z.infer<typeof BespokeStatus>;

/**
 * Jumlah minimum untuk desain DI LUAR katalog.
 *
 * Desain baru berarti pola dibuat dari nol, dan itu hanya sepadan bila
 * jumlahnya banyak. Pesanan yang mengikuti produk katalog — termasuk yang
 * cuma ganti warna — tidak kena aturan ini karena polanya sudah ada.
 *
 * Ditulis sekali di sini supaya angka yang dipakai form, server, dan
 * keterangan di halaman publik tidak pernah berbeda.
 */
export const BESPOKE_MIN_QUANTITY_CUSTOM = 100;

/**
 * Pesanan custom: dibuat admin setelah menyepakati barang dan harganya dengan
 * pembeli. Data pembeli dipakai untuk menemukan atau membuat Customer, jadi
 * email wajib -- itu kuncinya.
 */
export const BespokeOrderSchema = z
  .object({
    title: z.string().trim().min(3, "Judul minimal 3 karakter").max(100),
    description: z.string().optional(),
    /// Produk katalog yang jadi dasar pesanan; kosong = desain di luar katalog.
    productMasterId: z.string().nullable().optional(),
    quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
    quotedPrice: z
      .number()
      .positive("Harga yang disepakati harus lebih dari 0"),
    targetDate: z.coerce.date(),
    notes: z.string().optional(),
    customer: BeSpokeRequiredSchema.pick({
      name: true,
      email: true,
      phone: true,
    }),
  })
  .superRefine((data, ctx) => {
    /// Dijaga di skema, bukan cuma di layar: skema yang sama dipakai form dan
    /// server, jadi permintaan yang dikirim langsung ke API ikut tertolak.
    if (!data.productMasterId && data.quantity < BESPOKE_MIN_QUANTITY_CUSTOM) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: `Desain di luar katalog minimal ${BESPOKE_MIN_QUANTITY_CUSTOM} pcs. Kalau mengikuti produk katalog (boleh beda warna), pilih produknya dulu.`,
      });
    }
  });

export type BespokeOrderSchemaInput = z.input<typeof BespokeOrderSchema>;

/// Perubahan status berdiri sendiri: Selesai memicu pencatatan kas, jadi
/// tidak dicampur dengan penyuntingan data biasa.
export const UpdateBespokeStatusSchema = z.object({
  status: BespokeStatus,
});

export const BespokeQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: BespokeStatus.optional(),
});

export type BespokeQueryInput = z.infer<typeof BespokeQuerySchema>;
