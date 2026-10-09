import z from "zod";

/**
 * Pengajuan menjadi reseller.
 *
 * Untuk sekarang isian ini tidak disimpan di mana pun: hasilnya langsung
 * dirangkai jadi pesan WhatsApp. Skemanya tetap ditaruh di paket bersama —
 * bukan di komponen form — supaya saat nanti pengajuannya mulai dicatat
 * (tabel sendiri atau akun ber-role reseller), backend memakai aturan yang
 * sama persis dan tidak ada bidang yang diam-diam berbeda.
 */

export const RESELLER_BUSINESS_TYPES = [
  "Toko fisik",
  "Toko online / marketplace",
  "Jualan lewat media sosial",
  "Perorangan / reseller pemula",
  "Lainnya",
] as const;

export const RESELLER_MONTHLY_ESTIMATES = [
  "Di bawah 20 pcs",
  "20–50 pcs",
  "50–100 pcs",
  "Di atas 100 pcs",
  "Belum bisa memperkirakan",
] as const;

export const ResellerApplicationSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter"),
  /// Nomor WhatsApp yang bisa dihubungi. Divalidasi longgar karena orang
  /// menulisnya bermacam-macam (0812…, +62…, pakai spasi) — perapiannya
  /// dikerjakan `toWhatsAppNumber`, bukan dengan menolak pengisi.
  phone: z
    .string()
    .trim()
    .min(9, "Nomor WhatsApp minimal 9 digit")
    .regex(/^[0-9+\-\s()]+$/, "Nomor hanya boleh berisi angka dan tanda baca"),
  city: z.string().trim().min(2, "Kota minimal 2 karakter"),
  businessType: z.enum(RESELLER_BUSINESS_TYPES),
  monthlyEstimate: z.enum(RESELLER_MONTHLY_ESTIMATES),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional(),
});

export type ResellerApplicationInput = z.infer<
  typeof ResellerApplicationSchema
>;
