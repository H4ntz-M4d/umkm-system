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

export type ExpenseSchemaInput = z.input<typeof ExpenseSchema>;
export type ExpenseItemSchemaInput = z.infer<typeof ExpenseItemSchema>;
