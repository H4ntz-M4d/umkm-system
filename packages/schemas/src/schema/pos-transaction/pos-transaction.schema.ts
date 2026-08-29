import z from "zod";

export const PostTransactionStatus = z.enum([
  "PENDING",
  "PARKED",
  "PAID",
  "CANCELLED",
]);

export const PosTransactionItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const PosTransactionSchema = z.object({
  transId: z.string().nullable(),
  /**
   * Toko dan kasir tidak lagi wajib dikirim, dan yang dikirim pun diabaikan
   * untuk Kasir: keduanya diambil dari token oleh backend.
   *
   * Sebelumnya keduanya datang dari body dan tidak pernah dicocokkan dengan
   * pengguna yang login, sehingga siapa pun yang bisa memanggil endpoint POS
   * dapat mencatat transaksi atas nama toko dan kasir mana saja. Yang tidak
   * dikirim client tidak bisa dipalsukan client.
   *
   * `storeId` tetap diterima karena Owner dan Admin tidak terikat satu toko dan
   * harus memilihnya sendiri.
   */
  storeId: z.string().optional(),
  cashierId: z.string().optional(),
  paymentMethodId: z.string().optional().nullable(),
  status: PostTransactionStatus,
  itemTransaction: z.array(PosTransactionItemSchema),
});

export type PosTransactionSchemaInput = z.infer<typeof PosTransactionSchema>;
