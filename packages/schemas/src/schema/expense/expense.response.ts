import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const ExpenseItemData = z.object({
  id: z.string(),
  expenseId: z.string(),
  itemName: z.string().nullable(),
  quantity: z.number(),
  unit: z.string(),
  price: z.string(),
  subtotal: z.string(),
});

export const ExpenseProofData = z.object({
  id: z.string(),
  image: z.string(),
  createdAt: z.string(),
});

export const ExpenseData = z.object({
  id: z.string(),
  storeId: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  description: z.string().nullable(),
  totalAmount: z.string(),
  date: z.string(),
  createdAt: z.string(),
  /**
   * Dipakai daftar pengeluaran untuk menandai baris yang punya lampiran,
   * tanpa ikut mengirim seluruh URL-nya.
   *
   * Diberi nilai bawaan supaya respons yang belum memuat field ini tetap
   * terbaca, bukan gagal parse dan mengosongkan seluruh tabel.
   */
  proofCount: z.number().default(0),
  /// Admin yang menginput. Diberi nilai bawaan supaya data lama yang tidak
  /// punya jejaknya tetap terbaca, bukan gagal parse.
  createdById: z.coerce.string().nullable().default(null),
  createdByName: z.string().nullable().default(null),
});

export const ExpenseDetailData = ExpenseData.omit({
  categoryName: true,
}).extend({
  expenseItem: z.array(ExpenseItemData),
  proofs: z.array(ExpenseProofData).default([]),
});

export const ExpenseSummary = z.object({
  totalExpense: z.string(),
  totalExpenseThisMonth: z.string(),
  totalActiveCategory: z.number(),
});

export const ExpenseSummaryResponse = ApiSuccessResponse(ExpenseSummary);
export const CreateExpenseResponse = ApiSuccessResponse(ExpenseDetailData);
export const ExpenseListResponse = ApiSuccessResponse(z.array(ExpenseData));
export const SingleExpenseResponse = ApiSuccessResponse(ExpenseDetailData);
export const UpdateExpenseResponse = ApiSuccessResponse(ExpenseDetailData);
/// Seluruh bukti pengeluaran itu setelah unggah atau hapus — bukan hanya yang
/// baru, supaya dialog tinggal memakai daftarnya apa adanya.
export const ExpenseProofsResponse = ApiSuccessResponse(
  z.array(ExpenseProofData),
);

export type ExpenseProofDataType = z.infer<typeof ExpenseProofData>;
export type ExpenseDetailDataType = z.infer<typeof ExpenseDetailData>;
