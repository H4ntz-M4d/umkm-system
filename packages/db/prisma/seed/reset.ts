import { prisma } from "../../src/index";

/**
 * Tabel diurutkan dari yang paling bergantung ke yang paling dasar. Sebenarnya
 * CASCADE sudah menangani urutan, tapi daftar eksplisit ini berguna sebagai
 * dokumentasi cakupan reset — kalau ada model baru dan lupa didaftarkan di sini,
 * isinya akan tertinggal dan langsung terlihat mencurigakan saat verifikasi.
 */
const TABLES = [
  "cash_transaction",
  "inventory_ledger",
  "shipment",
  "order_item",
  "order",
  "cart_item",
  "cart",
  "wishlist",
  "customer_address",
  "be_spoke_details",
  "production",
  "transfer_payment_detail",
  "pos_transaction_item",
  "pos_transaction",
  "expense_item",
  "expense",
  "expense_category",
  "product_image",
  "product_image_group_value",
  "product_image_group",
  "product_variant_option",
  "product_variant_stock",
  "product_variant",
  "product_variant_value",
  "product_variant_type",
  "product_master",
  "categories",
  "bank_account",
  "payment_method",
  "employee",
  "customer",
  "users",
  "store",
] as const;

/**
 * Mengosongkan seluruh tabel dan mengembalikan sequence id ke 1.
 *
 * RESTART IDENTITY penting di sini: tanpa itu id akan melanjutkan nomor lama dan
 * data hasil seed tidak dimulai dari 1.
 */
export async function resetDatabase() {
  const list = TABLES.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`,
  );
}
