import z from "zod";

export const ExpenseItemSchema = z.object({
  rawMaterialId: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  price: z.number(),
  subtotal: z.number(),
});

export const ExpenseSchema = z.object({
  // Sebelumnya string kosong ikut lolos ke sini, lalu berakhir sebagai
  // BigInt("") di backend — crash yang tidak jelas asalnya bagi pengguna.
  storeId: z.string().min(1, "Pilih toko"),
  categoryId: z.string().min(1, "Pilih kategori"),
  description: z.string().optional(),
  totalAmount: z.number(),
  date: z.coerce.date(),
  expenseItem: z.array(ExpenseItemSchema).min(1, "Tambahkan minimal 1 item"),
});

/**
 * Edit pengeluaran memakai bentuk yang sama dengan tambah — satu form untuk
 * keduanya, jadi aturan validasinya tidak bisa menyimpang.
 *
 * Daftar itemnya diganti utuh, bukan ditambal per baris: form mengirim
 * keadaan akhir yang terlihat admin, dan itu yang disimpan.
 */
export const UpdateExpenseSchema = ExpenseSchema;

/// Batas lampiran bukti per pengeluaran. Ditulis sekali supaya backend,
/// dialog, dan pesan galatnya menyebut angka yang sama.
export const EXPENSE_PROOF_MAX_FILES = 5;

export type ExpenseSchemaInput = z.input<typeof ExpenseSchema>;
export type UpdateExpenseSchemaInput = z.input<typeof UpdateExpenseSchema>;
export type ExpenseItemSchemaInput = z.infer<typeof ExpenseItemSchema>;
