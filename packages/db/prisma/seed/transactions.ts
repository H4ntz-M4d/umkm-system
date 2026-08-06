import { prisma } from "../../src/index";
import type { MasterData, SeededVariant } from "./master";
import {
  addDays,
  atBusinessHour,
  atHour,
  chance,
  formatTransactionId,
  isWeekend,
  pick,
  pickMany,
  randomInt,
} from "./util";

/**
 * Rentang data: tiga bulan terakhir sampai hari ini.
 *
 * Seluruh peristiwa diproses berurutan hari demi hari, bukan diacak lalu
 * disimpan sekaligus. Itu yang menjamin stok tidak pernah minus: produksi selalu
 * tercatat sebelum penjualan yang memakainya.
 */
export const PERIOD_END = new Date(2026, 6, 28); // 28 Juli 2026
export const PERIOD_START = new Date(2026, 4, 1); // 1 Mei 2026
const STOCK_SEED_DATE = new Date(2026, 3, 26); // 26 April — produksi stok awal

interface StockState {
  stock: number;
  reserved: number;
}

interface LedgerRow {
  storeId: bigint;
  itemType: "PRODUCT_VARIANT";
  itemId: bigint;
  direction: "IN" | "OUT";
  source: "PRODUCTION" | "POS" | "ONLINE_ORDER";
  quantity: number;
  referenceId: bigint;
  createdAt: Date;
}

interface CashRow {
  storeId: bigint;
  type: "IN" | "OUT";
  source: "POS" | "ORDER" | "EXPENSE" | "PRODUCTION";
  amount: number;
  referenceId: bigint;
  createdAt: Date;
}

export interface SeedStats {
  production: number;
  bespoke: number;
  pos: number;
  order: number;
  expense: number;
  ledger: number;
  cash: number;
}

export async function seedTransactions(master: MasterData): Promise<SeedStats> {
  const { storeId, variants, cashierIds, customers, paymentMethods } = master;

  const stocks = new Map<bigint, StockState>(
    variants.map((variant) => [variant.id, { stock: 0, reserved: 0 }]),
  );

  const ledgerRows: LedgerRow[] = [];
  const cashRows: CashRow[] = [];
  const usedIds = new Set<string>();

  const stats: SeedStats = {
    production: 0,
    bespoke: 0,
    pos: 0,
    order: 0,
    expense: 0,
    ledger: 0,
    cash: 0,
  };

  /** Nomor transaksi unik; format meniru idFormat() di backend. */
  const uniqueId = (prefix: string, date: Date) => {
    let id = formatTransactionId(prefix, date);
    while (usedIds.has(id)) id = formatTransactionId(prefix, date);
    usedIds.add(id);
    return id;
  };

  // Barang kecil diproduksi lebih banyak, tas besar lebih sedikit — mengikuti
  // kecepatan pengerjaan rajut yang nyata.
  const batchSize = (variant: SeededVariant): [number, number] => {
    switch (variant.categoryName) {
      case "Aksesoris Kecil":
        return [25, 60];
      case "Dompet":
        return [12, 30];
      case "Tote Bag":
        return [8, 20];
      case "Sling Bag":
        return [6, 16];
      default:
        return [4, 12];
    }
  };

  /** Mencatat produksi selesai: stok bertambah + satu baris ledger IN. */
  const completeProduction = async (
    variant: SeededVariant,
    quantity: number,
    date: Date,
    type: "RESTOCK" | "MADE_TO_ORDER" | "PRE_ORDER",
    notes: string,
  ) => {
    const production = await prisma.production.create({
      data: {
        storeId,
        producedVariantId: variant.id,
        quantityProduced: quantity,
        type,
        status: "COMPLETED",
        notes,
        targetDate: date,
        createdAt: date,
      },
    });

    const state = stocks.get(variant.id)!;
    state.stock += quantity;

    ledgerRows.push({
      storeId,
      itemType: "PRODUCT_VARIANT",
      itemId: variant.id,
      direction: "IN",
      source: "PRODUCTION",
      quantity,
      referenceId: production.id,
      createdAt: date,
    });

    stats.production += 1;
  };

  // ========================= Produksi stok awal =============================
  for (const variant of variants) {
    const [min, max] = batchSize(variant);
    await completeProduction(
      variant,
      randomInt(min, max),
      atBusinessHour(STOCK_SEED_DATE),
      "RESTOCK",
      "Produksi stok awal sebelum periode berjalan",
    );
  }

  // ============================ Alur harian =================================
  const totalDays = Math.round(
    (PERIOD_END.getTime() - PERIOD_START.getTime()) / 86400000,
  );

  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset += 1) {
    const day = addDays(PERIOD_START, dayOffset);
    const month = day.getMonth();
    const dayOfMonth = day.getDate();

    // ---------------------------- Produksi ---------------------------------
    // Restock dua kali seminggu untuk varian yang stoknya menipis.
    if (day.getDay() === 1 || day.getDay() === 4) {
      // Diurutkan dari yang paling menipis, bukan diambil apa adanya dari array.
      // Tanpa pengurutan ini, kategori yang berada di akhir daftar produk tidak
      // pernah kebagian restock dan stoknya habis permanen.
      const lowStock = variants
        .filter((variant) => stocks.get(variant.id)!.stock < 12)
        .sort((a, b) => stocks.get(a.id)!.stock - stocks.get(b.id)!.stock)
        .slice(0, 16);

      const targets =
        lowStock.length > 0 ? lowStock : pickMany(variants, randomInt(3, 6));

      for (const variant of pickMany(targets, Math.min(targets.length, randomInt(6, 11)))) {
        const [min, max] = batchSize(variant);
        await completeProduction(
          variant,
          randomInt(Math.floor(min / 2), max),
          atBusinessHour(day),
          variant.type === "PRE_ORDER"
            ? "PRE_ORDER"
            : variant.type === "MADE_TO_ORDER"
              ? "MADE_TO_ORDER"
              : "RESTOCK",
          "Restock rutin",
        );
      }
    }

    // Sebagian produksi di akhir periode sengaja belum selesai, supaya papan
    // produksi tidak kosong dan status PLANNED/IN_PROGRESS ikut terwakili.
    if (dayOffset > totalDays - 12 && chance(0.35)) {
      const variant = pick(variants);
      const [min, max] = batchSize(variant);
      await prisma.production.create({
        data: {
          storeId,
          producedVariantId: variant.id,
          quantityProduced: randomInt(min, max),
          type: "RESTOCK",
          status: chance(0.5) ? "IN_PROGRESS" : "PLANNED",
          notes: "Dijadwalkan untuk pekan depan",
          targetDate: addDays(day, randomInt(3, 10)),
          createdAt: atBusinessHour(day),
        },
      });
      stats.production += 1;
    }

    // ----------------------------- Bespoke ---------------------------------
    // 1–3 pesanan khusus tiap bulan, jatuh di awal, tengah, dan akhir bulan.
    if (dayOfMonth === 6 || (dayOfMonth === 17 && chance(0.75)) || (dayOfMonth === 26 && chance(0.5))) {
      await seedBespoke(day);
    }

    // ------------------------------- POS -----------------------------------
    // Ramai transaksi naik dari bulan ke bulan, lebih tinggi di akhir pekan,
    // dan memuncak sekitar tanggal gajian.
    const monthlyBase = month === 4 ? 4 : month === 5 ? 5 : 6;
    const weekendBoost = isWeekend(day) ? randomInt(2, 4) : 0;
    const paydayBoost = dayOfMonth >= 25 || dayOfMonth <= 3 ? randomInt(1, 3) : 0;
    const posCount = Math.max(
      1,
      monthlyBase + weekendBoost + paydayBoost + randomInt(-2, 3),
    );

    for (let i = 0; i < posCount; i += 1) {
      await seedPosTransaction(day);
    }

    // ------------------------- Order online (Juli) -------------------------
    // Kanal online baru dibuka bulan terakhir, jadi volumenya menanjak pelan.
    if (month === 6) {
      const ramp = Math.min(3, Math.floor(dayOfMonth / 9));
      const orderCount = Math.max(0, randomInt(0, 2) + ramp);
      for (let i = 0; i < orderCount; i += 1) {
        await seedOnlineOrder(day);
      }
    }

    // ---------------------------- Pengeluaran ------------------------------
    await seedExpensesForDay(day);
  }

  // ============================ Simpan turunan ==============================
  if (ledgerRows.length > 0) {
    await prisma.inventoryLedger.createMany({ data: ledgerRows });
  }
  if (cashRows.length > 0) {
    await prisma.cashTransaction.createMany({ data: cashRows });
  }

  for (const [variantId, state] of stocks) {
    await prisma.productVariantStock.update({
      where: { productVariantId: variantId },
      data: { stock: state.stock, reserved_stock: state.reserved },
    });
  }

  stats.ledger = ledgerRows.length;
  stats.cash = cashRows.length;
  return stats;

  // =========================== Fungsi pembantu ==============================

  /**
   * Memilih beberapa varian yang stoknya cukup, lalu mengurangi stok simulasi.
   * Mengembalikan daftar kosong bila tidak ada yang tersedia — pemanggil wajib
   * memeriksa, karena transaksi tanpa item tidak masuk akal.
   */
  function takeSellableItems(maxLines: number) {
    const available = variants.filter(
      (variant) => stocks.get(variant.id)!.stock > 0,
    );
    if (available.length === 0) return [];

    const chosen = pickMany(available, randomInt(1, Math.min(maxLines, available.length)));
    const lines: { variant: SeededVariant; quantity: number; subtotal: number }[] = [];

    for (const variant of chosen) {
      const state = stocks.get(variant.id)!;
      const quantity = Math.min(state.stock, randomInt(1, 3));
      if (quantity <= 0) continue;

      lines.push({
        variant,
        quantity,
        subtotal: variant.price * quantity,
      });
    }

    return lines;
  }

  async function seedPosTransaction(day: Date) {
    const createdAt = atBusinessHour(day);
    const lines = takeSellableItems(3);
    if (lines.length === 0) return;

    // Sebagian kecil transaksi dibatalkan: stok tidak berkurang, kas tidak masuk.
    const cancelled = chance(0.04);
    const total = lines.reduce((sum, line) => sum + line.subtotal, 0);

    const paymentMethodId = pick([
      paymentMethods.cash,
      paymentMethods.cash,
      paymentMethods.cash,
      paymentMethods.qris,
      paymentMethods.qris,
      paymentMethods.bri,
      paymentMethods.bni,
    ]);

    const transaction = await prisma.posTransaction.create({
      data: {
        transId: uniqueId("POS", day),
        storeId,
        cashierId: pick(cashierIds),
        paymentMethodId,
        status: cancelled ? "CANCELLED" : "PAID",
        totalAmount: total,
        createdAt,
        items: {
          create: lines.map((line) => ({
            productVariantId: line.variant.id,
            quantity: line.quantity,
            price: line.variant.price,
            subtotal: line.subtotal,
          })),
        },
      },
    });

    stats.pos += 1;
    if (cancelled) return;

    // Cermin paidOperation() di PosTransactionService.
    for (const line of lines) {
      const state = stocks.get(line.variant.id)!;
      state.stock -= line.quantity;
      state.reserved += line.quantity;

      ledgerRows.push({
        storeId,
        itemType: "PRODUCT_VARIANT",
        itemId: line.variant.id,
        direction: "OUT",
        source: "POS",
        quantity: line.quantity,
        referenceId: transaction.id,
        createdAt,
      });
    }

    cashRows.push({
      storeId,
      type: "IN",
      source: "POS",
      amount: total,
      referenceId: transaction.id,
      createdAt,
    });
  }

  async function seedOnlineOrder(day: Date) {
    const createdAt = atBusinessHour(day);
    const lines = takeSellableItems(3);
    if (lines.length === 0) return;

    const customer = pick(customers);
    const itemsTotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    // Ongkir digratiskan, mengikuti SHIPPING_COST di CustomerOrderService.
    const shippingCost = 0;
    const total = itemsTotal + shippingCost;

    // Pesanan beberapa hari terakhir wajar masih menunggu bayar.
    const daysFromEnd = Math.round(
      (PERIOD_END.getTime() - day.getTime()) / 86400000,
    );
    const status = daysFromEnd <= 2 && chance(0.45)
      ? "PENDING"
      : chance(0.07)
        ? "CANCELLED"
        : daysFromEnd > 10 && chance(0.55)
          ? "COMPLETED"
          : daysFromEnd > 4 && chance(0.5)
            ? "SHIPPED"
            : "PAID";

    const isPaid = status !== "PENDING" && status !== "CANCELLED";

    const order = await prisma.order.create({
      data: {
        orderId: uniqueId("ORDER", day),
        storeId,
        customerId: customer.id,
        paymentMethodId: paymentMethods.qris,
        paymentGatewayRef:
          status === "CANCELLED" ? null : `snap-${uniqueId("TOK", day).toLowerCase()}`,
        status,
        totalAmount: total,
        createdAt,
        items: {
          create: lines.map((line) => ({
            productVariantId: line.variant.id,
            quantity: line.quantity,
            price: line.variant.price,
            subtotal: line.subtotal,
          })),
        },
        shipment: {
          create: {
            recipientName: customer.name,
            phone: customer.phone,
            addressLine: `Jl. ${pick(["Kaliurang", "Magelang", "Parangtritis", "Wates", "Godean"])} No. ${randomInt(1, 180)}`,
            city: pick(["Yogyakarta", "Sleman", "Bantul", "Klaten", "Magelang"]),
            province: pick(["DI Yogyakarta", "Jawa Tengah"]),
            courier: pick(["JNE", "J&T", "SiCepat", "AnterAja"]),
            shippingCost,
            createdAt,
          },
        },
      },
    });

    stats.order += 1;
    if (!isPaid) return;

    // Cermin paidOperationOrder() di CustomerOrderService.
    for (const line of lines) {
      const state = stocks.get(line.variant.id)!;
      state.stock -= line.quantity;
      state.reserved += line.quantity;

      ledgerRows.push({
        storeId,
        itemType: "PRODUCT_VARIANT",
        itemId: line.variant.id,
        direction: "OUT",
        source: "ONLINE_ORDER",
        quantity: line.quantity,
        referenceId: order.id,
        createdAt,
      });
    }

    cashRows.push({
      storeId,
      type: "IN",
      source: "ORDER",
      amount: total,
      referenceId: order.id,
      createdAt,
    });
  }

  async function seedBespoke(day: Date) {
    const createdAt = atBusinessHour(day);
    const customer = pick(customers);
    const quotedPrice = randomInt(9, 50) * 50000; // 450rb – 2,5jt

    const title = pick([
      "Tas rajut custom motif nama",
      "Set tote bag seragam komunitas",
      "Tas rajut hantaran pernikahan",
      "Sling bag custom warna kampus",
      "Dompet rajut souvenir acara",
      "Tote bag custom logo kantor",
    ]);

    // Bespoke tidak menghasilkan varian katalog, jadi producedVariantId kosong
    // dan tidak ada mutasi stok — sama seperti alur di ProductionService.
    const production = await prisma.production.create({
      data: {
        storeId,
        quantityProduced: randomInt(1, 12),
        type: "BE_SPOKE",
        status: "COMPLETED",
        notes: "Pesanan khusus pelanggan",
        targetDate: addDays(day, randomInt(10, 21)),
        createdAt,
        beSpokeDetails: {
          create: {
            customerId: customer.id,
            title,
            description: "Dikerjakan sesuai permintaan warna dan ukuran pelanggan.",
            quotedPrice,
            createdAt,
          },
        },
      },
      include: { beSpokeDetails: true },
    });

    // Cermin statusCompleted() di ProductionService: bespoke selesai = kas masuk.
    cashRows.push({
      storeId,
      type: "IN",
      source: "PRODUCTION",
      amount: quotedPrice,
      referenceId: production.id,
      createdAt,
    });

    if (production.beSpokeDetails) {
      await prisma.shipment.create({
        data: {
          beSpokeDetailsId: production.beSpokeDetails.id,
          recipientName: customer.name,
          phone: customer.phone,
          addressLine: `Jl. ${pick(["Kaliurang", "Magelang", "Imogiri", "Palagan"])} No. ${randomInt(1, 150)}`,
          city: pick(["Yogyakarta", "Sleman", "Bantul"]),
          province: "DI Yogyakarta",
          courier: pick(["JNE", "J&T", "SiCepat"]),
          shippingCost: randomInt(3, 8) * 5000,
          createdAt: addDays(createdAt, randomInt(10, 20)),
        },
      });
    }

    stats.production += 1;
    stats.bespoke += 1;
  }

  async function createExpense(
    day: Date,
    categoryName: string,
    description: string,
    items: { itemName: string; quantity: number; unit: string; price: number }[],
  ) {
    const createdAt = atBusinessHour(day);
    const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const expense = await prisma.expense.create({
      data: {
        storeId,
        date: createdAt,
        categoryId: master.expenseCategories[categoryName]!,
        description,
        totalAmount: total,
        createdAt,
        expenseItem: {
          create: items.map((item) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            subtotal: item.quantity * item.price,
          })),
        },
      },
    });

    // Cermin ExpenseService.create: setiap pengeluaran = kas keluar.
    cashRows.push({
      storeId,
      type: "OUT",
      source: "EXPENSE",
      amount: total,
      referenceId: expense.id,
      createdAt,
    });

    stats.expense += 1;
  }

  async function seedExpensesForDay(day: Date) {
    const dayOfMonth = day.getDate();

    // Rutin bulanan.
    if (dayOfMonth === 1) {
      await createExpense(atHour(day, 9), "Sewa Tempat", "Sewa ruko & workshop bulanan", [
        { itemName: "Sewa ruko", quantity: 1, unit: "bulan", price: 2500000 },
        { itemName: "Sewa workshop", quantity: 1, unit: "bulan", price: 1200000 },
      ]);
    }

    if (dayOfMonth === 5) {
      await createExpense(atHour(day, 10), "Internet", "Langganan internet toko", [
        { itemName: "Paket internet 100 Mbps", quantity: 1, unit: "bulan", price: 385000 },
      ]);
    }

    if (dayOfMonth === 10) {
      await createExpense(atHour(day, 11), "Listrik & Air", "Tagihan listrik & air", [
        { itemName: "Listrik", quantity: 1, unit: "bulan", price: randomInt(45, 78) * 10000 },
        { itemName: "Air PDAM", quantity: 1, unit: "bulan", price: randomInt(12, 22) * 10000 },
      ]);
    }

    if (dayOfMonth === 25) {
      await createExpense(atHour(day, 15), "Gaji Karyawan", "Gaji karyawan tetap", [
        { itemName: "Gaji admin", quantity: 1, unit: "orang", price: 2800000 },
        { itemName: "Gaji staf gudang", quantity: 1, unit: "orang", price: 2500000 },
        { itemName: "Gaji kasir", quantity: 2, unit: "orang", price: 2300000 },
      ]);
    }

    if (dayOfMonth === 15 || dayOfMonth === 28) {
      await createExpense(atHour(day, 16), "Upah Pengrajin", "Upah borongan pengrajin", [
        { itemName: "Upah rajut tas", quantity: randomInt(8, 22), unit: "pcs", price: 45000 },
        { itemName: "Upah rajut aksesoris", quantity: randomInt(20, 60), unit: "pcs", price: 6000 },
      ]);
    }

    // Tidak rutin.
    if (chance(0.16)) {
      await createExpense(day, "Bahan Baku", "Pembelian benang & bahan rajut", [
        { itemName: "Benang katun", quantity: randomInt(10, 40), unit: "gulung", price: 22000 },
        { itemName: "Tali kur", quantity: randomInt(5, 20), unit: "roll", price: 35000 },
        { itemName: "Resleting", quantity: randomInt(10, 50), unit: "pcs", price: 3500 },
      ]);
    }

    if (chance(0.07)) {
      await createExpense(day, "Kemasan", "Pembelian kemasan produk", [
        { itemName: "Paper bag", quantity: randomInt(50, 200), unit: "pcs", price: 2500 },
        { itemName: "Kartu ucapan", quantity: randomInt(50, 150), unit: "pcs", price: 1200 },
      ]);
    }

    if (chance(0.09)) {
      await createExpense(day, "Pemasaran", "Iklan & promosi media sosial", [
        { itemName: pick(["Iklan Instagram", "Iklan TikTok", "Endorse micro influencer"]), quantity: 1, unit: "paket", price: randomInt(15, 120) * 10000 },
      ]);
    }

    if (chance(0.12)) {
      await createExpense(day, "Transportasi", "Operasional & kirim bahan", [
        { itemName: "Bensin & parkir", quantity: 1, unit: "kali", price: randomInt(5, 25) * 10000 },
      ]);
    }

    if (chance(0.03)) {
      await createExpense(day, "Peralatan", "Pembelian alat rajut", [
        { itemName: "Hakpen set", quantity: randomInt(1, 4), unit: "set", price: 85000 },
        { itemName: "Gunting benang", quantity: randomInt(1, 5), unit: "pcs", price: 25000 },
      ]);
    }
  }
}
