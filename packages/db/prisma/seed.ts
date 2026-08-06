import { prisma } from "../src/index";
import { resetDatabase } from "./seed/reset";
import { seedMaster, SEED_PASSWORD } from "./seed/master";
import { seedTransactions, PERIOD_START, PERIOD_END } from "./seed/transactions";
import { seedCustomerExtras } from "./seed/customer-extras";
import { resetRandom } from "./seed/util";

const rupiah = (value: unknown) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

const tanggal = (value: Date) =>
  value.toLocaleDateString("id-ID", { dateStyle: "medium" });

async function main() {
  console.log("Mengosongkan database...");
  await resetDatabase();

  // Benih tetap: menjalankan ulang seed menghasilkan data yang sama persis.
  resetRandom();

  console.log("Membuat data master...");
  const master = await seedMaster();

  console.log(
    `Membuat transaksi ${tanggal(PERIOD_START)} - ${tanggal(PERIOD_END)}...`,
  );
  const stats = await seedTransactions(master);

  console.log("Membuat data pendukung pelanggan...");
  const extras = await seedCustomerExtras(master);

  // ============================== Ringkasan =================================
  const [cashIn, cashOut] = await Promise.all([
    prisma.cashTransaction.aggregate({
      where: { type: "IN" },
      _sum: { amount: true },
    }),
    prisma.cashTransaction.aggregate({
      where: { type: "OUT" },
      _sum: { amount: true },
    }),
  ]);

  const masuk = Number(cashIn._sum.amount ?? 0);
  const keluar = Number(cashOut._sum.amount ?? 0);

  console.log("\n=============== Ringkasan Seed ===============");
  console.log(
    `Produk            : ${await prisma.productMaster.count()} (${await prisma.productVariant.count()} varian)`,
  );
  console.log(`Karyawan          : ${await prisma.employee.count()}`);
  console.log(`Pelanggan         : ${await prisma.customer.count()}`);
  console.log(
    `Produksi          : ${stats.production} (termasuk ${stats.bespoke} bespoke)`,
  );
  console.log(`Transaksi POS     : ${stats.pos}`);
  console.log(`Order online      : ${stats.order}`);
  console.log(`Pengeluaran       : ${stats.expense}`);
  console.log(`Inventory ledger  : ${stats.ledger} baris`);
  console.log(`Cash transaction  : ${stats.cash} baris`);
  console.log(
    `Alamat/wishlist/keranjang : ${extras.addresses} / ${extras.wishlists} / ${extras.carts}`,
  );
  console.log("----------------------------------------------");
  console.log(`Kas masuk         : ${rupiah(masuk)}`);
  console.log(`Kas keluar        : ${rupiah(keluar)}`);
  console.log(`Kas bersih        : ${rupiah(masuk - keluar)}`);
  console.log("==============================================");
  console.log(`\nSemua akun memakai kata sandi: ${SEED_PASSWORD}`);
  console.log("Owner: nurkayekti@nurfacraft.com, fendi@nurfacraft.com");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
