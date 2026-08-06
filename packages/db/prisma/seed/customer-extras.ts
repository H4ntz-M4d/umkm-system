import { prisma } from "../../src/index";
import type { MasterData } from "./master";
import { chance, pick, pickMany, randomInt } from "./util";

const STREETS = [
  "Jl. Kaliurang KM 5",
  "Jl. Magelang KM 7",
  "Jl. Parangtritis",
  "Jl. Wates",
  "Jl. Godean",
  "Jl. Palagan Tentara Pelajar",
  "Jl. Imogiri Timur",
];

const CITIES = [
  { city: "Yogyakarta", province: "DI Yogyakarta" },
  { city: "Sleman", province: "DI Yogyakarta" },
  { city: "Bantul", province: "DI Yogyakarta" },
  { city: "Klaten", province: "Jawa Tengah" },
  { city: "Magelang", province: "Jawa Tengah" },
];

/**
 * Data pendukung sisi pelanggan: buku alamat, wishlist, dan beberapa keranjang
 * yang masih aktif. Keranjang sengaja hanya diisi untuk sebagian pelanggan,
 * karena keranjang yang sudah di-checkout memang dikosongkan aplikasi.
 */
export async function seedCustomerExtras(master: MasterData) {
  const { customers, variants } = master;

  let addresses = 0;
  let wishlists = 0;
  let carts = 0;

  for (const customer of customers) {
    // Setiap pelanggan punya alamat utama; sebagian menambah alamat kedua.
    const total = chance(0.35) ? 2 : 1;

    for (let index = 0; index < total; index += 1) {
      const location = pick(CITIES);
      await prisma.customerAddress.create({
        data: {
          customerId: customer.id,
          recipientName: customer.name,
          phone: customer.phone,
          addressLine: `${pick(STREETS)} No. ${randomInt(1, 180)}`,
          city: location.city,
          province: location.province,
          isDefault: index === 0,
        },
      });
      addresses += 1;
    }

    // Wishlist disimpan per produk, bukan per varian.
    const productIds = [...new Set(variants.map((variant) => variant.productMasterId))];
    for (const productMasterId of pickMany(productIds, randomInt(0, 5))) {
      await prisma.wishlist.create({
        data: { customerId: customer.id, productMasterId },
      });
      wishlists += 1;
    }

    // Keranjang yang belum di-checkout.
    if (chance(0.4)) {
      const cart = await prisma.cart.create({ data: { customerId: customer.id } });
      carts += 1;

      for (const variant of pickMany(variants, randomInt(1, 3))) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productVariantId: variant.id,
            quantity: randomInt(1, 2),
          },
        });
      }
    }
  }

  return { addresses, wishlists, carts };
}
