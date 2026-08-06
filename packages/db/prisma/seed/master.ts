import bcrypt from "bcryptjs";
import { signatureForOptions } from "@repo/schemas";
import { prisma } from "../../src/index";
import { CATEGORIES, PRODUCTS, type ProductDef } from "./catalog-data";
import { roundPrice, slugify } from "./util";

/// Kata sandi seragam untuk seluruh akun hasil seed. Hanya untuk data contoh.
export const SEED_PASSWORD = "password123";

export interface SeededVariant {
  id: bigint;
  sku: string;
  price: number;
  cost: number;
  productMasterId: bigint;
  productName: string;
  categoryName: string;
  options: Record<string, string>;
  type: ProductDef["type"];
}

export interface MasterData {
  storeId: bigint;
  cashierIds: bigint[];
  customers: { id: bigint; name: string; email: string; phone: string }[];
  variants: SeededVariant[];
  paymentMethods: { cash: bigint; bri: bigint; bni: bigint; qris: bigint };
  expenseCategories: Record<string, bigint>;
}

const EMPLOYEES = [
  { name: "Nurkayekti", email: "nurkayekti@nurfacraft.com", role: "OWNER" },
  { name: "Fendi", email: "fendi@nurfacraft.com", role: "OWNER" },
  { name: "Rina Puspitasari", email: "rina@nurfacraft.com", role: "ADMIN" },
  { name: "Bayu Nugroho", email: "bayu@nurfacraft.com", role: "GUDANG" },
  // Transaksi POS wajib punya cashierId, jadi dua kasir ikut dibuat meski tidak
  // disebut di instruksi — tanpa mereka data POS tidak mungkin dibentuk.
  { name: "Dewi Lestari", email: "dewi@nurfacraft.com", role: "KASIR" },
  { name: "Sigit Prakoso", email: "sigit@nurfacraft.com", role: "KASIR" },
] as const;

const CUSTOMERS = [
  { name: "Ayu Wulandari", email: "ayu.wulandari@gmail.com", phone: "081234567801" },
  { name: "Rizky Ramadhan", email: "rizky.ramadhan@gmail.com", phone: "081234567802" },
  { name: "Salsabila Putri", email: "salsabila.putri@gmail.com", phone: "081234567803" },
  { name: "Bagus Setiawan", email: "bagus.setiawan@gmail.com", phone: "081234567804" },
  { name: "Nadia Rahmawati", email: "nadia.rahma@gmail.com", phone: "081234567805" },
  { name: "Fajar Nugroho", email: "fajar.nugroho@gmail.com", phone: "081234567806" },
  { name: "Intan Permata", email: "intan.permata@gmail.com", phone: "081234567807" },
  { name: "Yoga Pratama", email: "yoga.pratama@gmail.com", phone: "081234567808" },
  { name: "Mega Anggraini", email: "mega.anggraini@gmail.com", phone: "081234567809" },
  { name: "Dimas Aditya", email: "dimas.aditya@gmail.com", phone: "081234567810" },
  { name: "Laras Ayu", email: "laras.ayu@gmail.com", phone: "081234567811" },
  { name: "Wahyu Saputra", email: "wahyu.saputra@gmail.com", phone: "081234567812" },
] as const;

const EXPENSE_CATEGORIES = [
  { name: "Bahan Baku", color: "#cc5933", description: "Benang, tali kur, resleting, dan bahan rajut lain" },
  { name: "Gaji Karyawan", color: "#747a52", description: "Gaji bulanan karyawan tetap" },
  { name: "Upah Pengrajin", color: "#8a6f4e", description: "Upah borongan pengrajin per produk" },
  { name: "Sewa Tempat", color: "#4e6f8a", description: "Sewa ruko dan workshop" },
  { name: "Listrik & Air", color: "#c9a227", description: "Tagihan utilitas bulanan" },
  { name: "Internet", color: "#5b8a72", description: "Langganan internet toko" },
  { name: "Kemasan", color: "#a4694f", description: "Paper bag, dus, kartu ucapan" },
  { name: "Pemasaran", color: "#b05c7a", description: "Iklan media sosial dan endorse" },
  { name: "Transportasi", color: "#6b7280", description: "Ongkos kirim bahan dan operasional" },
  { name: "Peralatan", color: "#7c6f9c", description: "Hakpen, gunting, dan alat jahit" },
] as const;

/**
 * Menyingkat nilai varian jadi potongan SKU. Nilai bersuku kata banyak diambil
 * dua huruf per kata ("Zigzag Krem" -> "ZIKR") supaya tidak tertukar dengan
 * nilai lain yang berawalan sama.
 */
function skuToken(value: string): string {
  const words = value.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0]!.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
  }

  return words
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2))
    .join("")
    .toUpperCase();
}

/**
 * Membuat seluruh data master dan mengembalikan id yang dibutuhkan seeder
 * transaksi. Semua stok awal dibuat 0 — pengisiannya nanti lewat data produksi,
 * persis seperti alur aslinya di aplikasi.
 */
export async function seedMaster(): Promise<MasterData> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const store = await prisma.store.create({
    data: { name: "Nurfa Craft Yogyakarta", isActive: true },
  });

  // ============================== Karyawan ==================================
  const cashierIds: bigint[] = [];

  for (const employee of EMPLOYEES) {
    const user = await prisma.users.create({
      data: {
        email: employee.email,
        password: passwordHash,
        role: employee.role,
        isActive: true,
        storeId: store.id,
        slug: slugify(employee.name),
      },
    });

    await prisma.employee.create({
      data: {
        name: employee.name,
        userId: user.id,
        phone: `0812${String(user.id).padStart(8, "0")}`,
        address: "Yogyakarta",
      },
    });

    if (employee.role === "KASIR") cashierIds.push(user.id);
  }

  // ============================== Customer ==================================
  const customers: MasterData["customers"] = [];

  for (const customer of CUSTOMERS) {
    const user = await prisma.users.create({
      data: {
        email: customer.email,
        password: passwordHash,
        role: "CUSTOMER",
        isActive: true,
        slug: slugify(customer.name),
      },
    });

    const created = await prisma.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        userId: user.id,
      },
    });

    customers.push({
      id: created.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
  }

  // ============================== Kategori ==================================
  const categoryIds = new Map<string, bigint>();

  for (const category of CATEGORIES) {
    const created = await prisma.categories.create({
      data: {
        name: category.name,
        description: category.description,
        slug: slugify(category.name),
        status: true,
      },
    });
    categoryIds.set(category.name, created.id);
  }

  // =============================== Produk ===================================
  const variants: SeededVariant[] = [];
  const usedSkus = new Set<string>();

  for (const product of PRODUCTS) {
    const useVariant = product.variantTypes.length > 0;

    const master = await prisma.productMaster.create({
      data: {
        name: product.name,
        description: product.description,
        slug: slugify(product.name),
        categoryId: categoryIds.get(product.category)!,
        useVariant,
        type: product.type,
        status: "ACTIVE",
      },
    });

    // Tipe & nilai varian. typeValueMap dipakai membangun junction Image Group,
    // meniru ProductImageGroupService.sync di backend.
    const typeValueMap = new Map<string, Map<string, bigint>>();

    for (const variantType of product.variantTypes) {
      const createdType = await prisma.productVariantType.create({
        data: {
          productMasterId: master.id,
          name: variantType.name,
          isHaveVisual: variantType.isHaveVisual,
        },
      });

      const valueMap = new Map<string, bigint>();
      for (const value of variantType.values) {
        const createdValue = await prisma.productVariantValue.create({
          data: { variantTypeId: createdType.id, value },
        });
        valueMap.set(value, createdValue.id);
      }
      typeValueMap.set(variantType.name, valueMap);
    }

    // Kombinasi kartesian seluruh nilai varian.
    const combinations = product.variantTypes.reduce<Record<string, string>[]>(
      (acc, variantType) =>
        acc.flatMap((combo) =>
          variantType.values.map((value) => ({
            ...combo,
            [variantType.name]: value,
          })),
        ),
      [{}],
    );

    const visualTypeNames = new Set(
      product.variantTypes
        .filter((variantType) => variantType.isHaveVisual)
        .map((variantType) => variantType.name),
    );

    const groupIds = new Map<string, bigint>();
    let sequence = 1;

    for (const options of combinations) {
      const surcharge = product.sizeSurcharge?.[options["Ukuran"] ?? ""] ?? 0;
      const price = roundPrice(product.basePrice + surcharge);
      const cost = roundPrice(product.baseCost + surcharge * 0.45);

      const skuParts = Object.values(options).map(skuToken).join("-");
      let sku = skuParts
        ? `${product.skuPrefix}-${skuParts}`
        : `${product.skuPrefix}-${String(sequence).padStart(2, "0")}`;

      // SKU wajib unik secara global. Singkatan bisa bertabrakan untuk nilai
      // yang berawalan sama ("Zigzag Krem" vs "Zigzag Navy"), jadi nomor urut
      // ditempelkan hanya bila memang diperlukan.
      if (usedSkus.has(sku)) sku = `${sku}-${String(sequence).padStart(2, "0")}`;
      usedSkus.add(sku);

      // Grup gambar di-upsert per signature, sama seperti service aslinya, jadi
      // beberapa varian yang hanya beda ukuran berbagi satu grup foto.
      const signature = signatureForOptions(options, visualTypeNames);
      let groupId = groupIds.get(signature);

      if (!groupId) {
        const group = await prisma.productImageGroup.create({
          data: { productMasterId: master.id, signature },
        });
        groupId = group.id;
        groupIds.set(signature, groupId);

        const valueIds = Object.entries(options)
          .filter(([typeName]) => visualTypeNames.has(typeName))
          .map(([typeName, value]) => typeValueMap.get(typeName)?.get(value))
          .filter((id): id is bigint => id !== undefined);

        if (valueIds.length > 0) {
          await prisma.productImageGroupValue.createMany({
            data: valueIds.map((variantValueId) => ({
              imageGroupId: groupId!,
              variantValueId,
            })),
          });
        }
      }

      const variant = await prisma.productVariant.create({
        data: {
          productMasterId: master.id,
          sku,
          price,
          cost,
          isActive: true,
          imageGroupId: groupId,
        },
      });

      for (const [typeName, value] of Object.entries(options)) {
        await prisma.productVariantOption.create({
          data: {
            productVariantId: variant.id,
            variantValueId: typeValueMap.get(typeName)!.get(value)!,
          },
        });
      }

      // Stok dimulai dari nol; diisi oleh data produksi agar ledger-nya nyambung.
      await prisma.productVariantStock.create({
        data: { productVariantId: variant.id, stock: 0, reserved_stock: 0 },
      });

      variants.push({
        id: variant.id,
        sku,
        price,
        cost,
        productMasterId: master.id,
        productName: product.name,
        categoryName: product.category,
        options,
        type: product.type,
      });

      sequence += 1;
    }
  }

  // =========================== Metode Pembayaran ============================
  const cash = await prisma.paymentMethod.create({
    data: { name: "Cash", channel: "CASH", isActive: true },
  });

  const bri = await prisma.paymentMethod.create({
    data: { name: "BRI", channel: "BANK_TRANSFER", isActive: true },
  });
  await prisma.bankAccount.create({
    data: {
      paymentMethodId: bri.id,
      bankName: "BRI",
      accountNumber: "002401000123456",
      accountName: "Nurkayekti",
    },
  });

  const bni = await prisma.paymentMethod.create({
    data: { name: "BNI", channel: "BANK_TRANSFER", isActive: true },
  });
  await prisma.bankAccount.create({
    data: {
      paymentMethodId: bni.id,
      bankName: "BNI",
      accountNumber: "0987654321",
      accountName: "Nurkayekti",
    },
  });

  // QRIS lewat Midtrans — inilah metode yang dipakai checkout online.
  const qris = await prisma.paymentMethod.create({
    data: { name: "QRIS", channel: "MIDTRANS", isActive: true },
  });

  // =========================== Kategori Pengeluaran =========================
  const expenseCategories: Record<string, bigint> = {};

  for (const category of EXPENSE_CATEGORIES) {
    const created = await prisma.expenseCategory.create({
      data: {
        name: category.name,
        description: category.description,
        color: category.color,
        isActive: true,
      },
    });
    expenseCategories[category.name] = created.id;
  }

  return {
    storeId: store.id,
    cashierIds,
    customers,
    variants,
    paymentMethods: { cash: cash.id, bri: bri.id, bni: bni.id, qris: qris.id },
    expenseCategories,
  };
}
