import { toIDR } from "./format-money";

/**
 * Nomor WhatsApp toko, dalam format internasional tanpa tanda plus.
 *
 * Ditulis sekali di sini karena dipakai tiga tempat: dua tautan kontak di
 * footer dan tombol Pesan. Sebelumnya diketik ulang di tiap tempat, yang berarti
 * mengganti nomor menyisakan satu tautan lama tanpa ada yang menyadarinya.
 */
export const SHOP_WHATSAPP_NUMBER = "628983689868";

export const shopWhatsAppUrl = () => `https://wa.me/${SHOP_WHATSAPP_NUMBER}`;

export type WhatsAppOrderItem = {
  productName: string;
  /// Dibawa supaya admin bisa mencocokkan langsung ke katalog/stok tanpa
  /// menebak dari nama produk saja — SKU tidak pernah ambigu, nama bisa.
  sku: string;
  /// Pilihan varian yang sudah dirangkai, mis. "Biru / L". Boleh kosong.
  variantLabel?: string;
  quantity: number;
  price: string | number;
  subtotal: string | number;
  /// Permintaan custom dari pembeli untuk item ini.
  notes?: string;
};

export type WhatsAppOrderSummary = {
  orderId: string;
  buyerName: string;
  items: WhatsAppOrderItem[];
  estimatedTotal: string | number;
  deliveryMethod: "SHIP" | "PICKUP";
};

/**
 * Menyusun pesan pembuka percakapan pemesanan.
 *
 * Nomor pesanan ikut dibawa supaya admin bisa langsung menemukan barisnya di
 * sistem tanpa bertanya ulang — percakapan di WhatsApp dan catatan di sistem
 * menunjuk pesanan yang sama.
 *
 * Totalnya disebut "perkiraan" dengan sengaja: harga katalog cuma gambaran,
 * dan angka yang berlaku adalah hasil kesepakatan di percakapan ini. Menyebutnya
 * "total" saja membuat pembeli mengira harganya sudah final.
 */
export function buildOrderWhatsAppMessage(order: WhatsAppOrderSummary): string {
  const lines: string[] = [
    `Halo NurfaCraft, saya mau memesan. (No. pesanan: ${order.orderId})`,
    "",
  ];

  order.items.forEach((item, index) => {
    const variant = item.variantLabel ? ` — ${item.variantLabel}` : "";
    lines.push(`${index + 1}. ${item.productName}${variant}`);
    lines.push(`   SKU: ${item.sku}`);
    lines.push(
      `   ${item.quantity} x ${toIDR(item.price)} = ${toIDR(item.subtotal)}`,
    );
    if (item.notes?.trim()) {
      lines.push(`   Permintaan: \n${item.notes.trim()}`);
    }
  });

  lines.push("");
  lines.push(`Perkiraan total: ${toIDR(order.estimatedTotal)}`);
  lines.push(
    order.deliveryMethod === "PICKUP"
      ? "Pengambilan: diambil sendiri di rumah produksi"
      : "Pengambilan: dikirim ke alamat saya",
  );
  lines.push(`Atas nama: ${order.buyerName}`);
  lines.push("");
  lines.push("Mohon info ketersediaan, harga, dan DP-nya ya. Terima kasih!");

  return lines.join("\n");
}

/// Tautan wa.me lengkap dengan pesan yang sudah terisi.
export function buildOrderWhatsAppUrl(order: WhatsAppOrderSummary): string {
  const text = encodeURIComponent(buildOrderWhatsAppMessage(order));
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${text}`;
}

/**
 * Merapikan nomor telepon jadi format internasional yang dipahami wa.me.
 *
 * Nomor di database tidak konsisten — kadang "0812...", kadang "62812...",
 * kadang ada spasi/tanda hubung. wa.me hanya menerima digit dengan kode
 * negara, tanpa "0" di depan dan tanpa "+".
 */
function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return `62${digits}`;
}

export type WhatsAppReadyOrderItem = {
  productName: string;
  quantity: number;
};

export type WhatsAppReadyOrderSummary = {
  orderId: string;
  buyerName: string;
  /// Nomor si PEMBELI — pesan ini dikirim toko ke customer, arahnya
  /// kebalikan dari buildOrderWhatsAppUrl yang selalu menuju nomor toko.
  buyerPhone: string;
  items: WhatsAppReadyOrderItem[];
  deliveryMethod: "SHIP" | "PICKUP";
};

/**
 * Pesan konfirmasi ke customer: pesanan lunas dan produknya sudah jadi.
 *
 * Dipakai admin saat menandai pesanan Lunas di dialog nego — pada bisnis ini
 * pelunasan biasanya memang terjadi setelah barangnya selesai diproduksi,
 * jadi momen itu sekaligus momen yang tepat untuk mengabari customer.
 */
export function buildOrderReadyWhatsAppMessage(
  order: WhatsAppReadyOrderSummary,
): string {
  const lines: string[] = [
    `Halo ${order.buyerName}, kabar baik dari NurfaCraft!`,
    "",
    `Pesanan ${order.orderId} kamu sudah lunas dan produknya sudah selesai diproduksi:`,
    "",
  ];

  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName} x${item.quantity}`);
  });

  lines.push("");
  lines.push(
    order.deliveryMethod === "PICKUP"
      ? "Silakan diambil di rumah produksi ya — kabari dulu sebelum datang."
      : "Pesanan akan segera kami kirim ke alamatmu.",
  );
  lines.push("");
  lines.push("Terima kasih sudah menunggu!");

  return lines.join("\n");
}

/// Tautan wa.me ke nomor CUSTOMER (bukan nomor toko), dengan pesan konfirmasi
/// produksi selesai yang sudah terisi.
export function buildOrderReadyWhatsAppUrl(
  order: WhatsAppReadyOrderSummary,
): string {
  const text = encodeURIComponent(buildOrderReadyWhatsAppMessage(order));
  const number = toWhatsAppNumber(order.buyerPhone);
  return `https://wa.me/${number}?text=${text}`;
}

export type WhatsAppProductionDoneOrderSummary = WhatsAppReadyOrderSummary & {
  /// Harga hasil nego yang berlaku — bukan estimatedTotal.
  totalAmount: string | number;
  /// Berapa yang sudah masuk (biasanya DP). `null`/0 kalau belum ada sama
  /// sekali, wajar untuk pesanan yang produksinya jalan tanpa DP di muka.
  dpAmount: string | number | null;
};

/**
 * Pesan ke customer: produk sudah jadi, TAPI belum tentu lunas — beda dengan
 * `buildOrderReadyWhatsAppMessage` yang mengasumsikan pembayaran sudah penuh.
 *
 * Dipakai saat admin menandai status "Produksi Selesai", tahap yang sengaja
 * dipisah dari Lunas: barangnya sudah jadi duluan, pelunasannya menyusul.
 * Sisa tagihan dihitung di sini supaya customer langsung tahu angkanya tanpa
 * perlu bertanya balik.
 */
export function buildProductionDoneWhatsAppMessage(
  order: WhatsAppProductionDoneOrderSummary,
): string {
  const total = Number(order.totalAmount);
  const dp = Number(order.dpAmount ?? 0);
  const remaining = Math.max(total - dp, 0);

  const lines: string[] = [
    `Halo ${order.buyerName}, kabar baik dari NurfaCraft!`,
    "",
    `Pesanan ${order.orderId} kamu sudah SELESAI DIPRODUKSI:`,
    "",
  ];

  order.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName} x${item.quantity}`);
  });

  lines.push("");
  lines.push(
    order.deliveryMethod === "PICKUP"
      ? "Sebelum diambil, mohon selesaikan pelunasan pembayaran dulu ya:"
      : "Sebelum kami kirim, mohon selesaikan pelunasan pembayaran dulu ya:",
  );
  lines.push(`Total: ${toIDR(total)}`);
  if (dp > 0) {
    lines.push(`Sudah dibayar: ${toIDR(dp)}`);
  }
  lines.push(`Sisa yang perlu dilunasi: ${toIDR(remaining)}`);
  lines.push("");
  lines.push("Balas chat ini ya kalau sudah transfer. Terima kasih!");

  return lines.join("\n");
}

/// Tautan wa.me ke nomor CUSTOMER dengan pesan "produksi selesai, mohon
/// pelunasan" yang sudah terisi.
export function buildProductionDoneWhatsAppUrl(
  order: WhatsAppProductionDoneOrderSummary,
): string {
  const text = encodeURIComponent(buildProductionDoneWhatsAppMessage(order));
  const number = toWhatsAppNumber(order.buyerPhone);
  return `https://wa.me/${number}?text=${text}`;
}

export type ResellerInquiry = {
  name: string;
  phone: string;
  city: string;
  businessType: string;
  monthlyEstimate: string;
  notes?: string;
};

/**
 * Pesan pembuka calon reseller.
 *
 * Isinya sengaja lengkap dan berurutan: pengajuan ini tidak tersimpan di
 * sistem mana pun, jadi percakapan WhatsApp inilah satu-satunya catatannya.
 * Kalau datanya dipecah-pecah menyusul, admin harus menyusun ulang sendiri
 * dari beberapa pesan.
 */
export function buildResellerWhatsAppMessage(data: ResellerInquiry): string {
  const lines = [
    "Halo NurfaCraft, saya tertarik menjadi reseller.",
    "",
    `Nama: ${data.name}`,
    `Kota: ${data.city}`,
    `Jenis usaha: ${data.businessType}`,
    `Perkiraan pembelian per bulan: ${data.monthlyEstimate}`,
    `Nomor WhatsApp: ${data.phone}`,
  ];

  if (data.notes?.trim()) {
    lines.push("", `Catatan:\n${data.notes.trim()}`);
  }

  lines.push("", "Mohon info harga reseller dan syaratnya ya. Terima kasih!");

  return lines.join("\n");
}

export function buildResellerWhatsAppUrl(data: ResellerInquiry): string {
  const text = encodeURIComponent(buildResellerWhatsAppMessage(data));
  return `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${text}`;
}
