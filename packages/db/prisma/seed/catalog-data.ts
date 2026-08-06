/**
 * Definisi katalog: 5 kategori dan 20 produk rajut beserta variannya.
 *
 * Gambar sengaja tidak diisi — Image Group tetap dibuat lengkap dengan signature
 * yang benar, jadi admin tinggal mengunggah foto lewat halaman produk dan foto
 * itu langsung menempel ke kombinasi varian yang tepat.
 */

export interface VariantTypeDef {
  name: string;
  /// Hanya tipe visual yang membentuk Image Group. Warna & Motif visual, Ukuran tidak.
  isHaveVisual: boolean;
  values: string[];
}

export interface ProductDef {
  name: string;
  category: string;
  description: string;
  type: "READY_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER";
  skuPrefix: string;
  /// Harga dasar; varian tertentu bisa menambah harga lewat `sizeSurcharge`.
  basePrice: number;
  /// Modal produksi, dipakai mengisi ProductVariant.cost.
  baseCost: number;
  variantTypes: VariantTypeDef[];
  /// Tambahan harga per nilai ukuran, kalau produk punya tipe "Ukuran".
  sizeSurcharge?: Record<string, number>;
}

export const CATEGORIES = [
  {
    name: "Aksesoris Kecil",
    description: "Gantungan kunci, bros, dan pernik rajut lainnya",
  },
  { name: "Tote Bag", description: "Tas jinjing rajut untuk kegiatan harian" },
  { name: "Tas", description: "Tas rajut ukuran sedang hingga besar" },
  { name: "Dompet", description: "Dompet dan pouch rajut" },
  { name: "Sling Bag", description: "Tas selempang rajut" },
] as const;

const WARNA_PASTEL = ["Krem", "Sage", "Dusty Pink", "Mocca"];
const WARNA_DASAR = ["Hitam", "Putih Tulang", "Navy", "Terracotta"];
const WARNA_CERAH = ["Mustard", "Terracotta", "Olive", "Krem"];

export const PRODUCTS: ProductDef[] = [
  // ============================ Aksesoris Kecil =============================
  {
    name: "Gantungan Kunci Bunga Daisy",
    category: "Aksesoris Kecil",
    description:
      "Gantungan kunci rajut berbentuk bunga daisy, dikerjakan tangan dengan benang katun halus. Ringan dan cocok untuk hadiah kecil.",
    type: "READY_STOCK",
    skuPrefix: "AK-DSY",
    basePrice: 18000,
    baseCost: 7500,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_PASTEL },
    ],
  },
  {
    name: "Gantungan Kunci Strawberry",
    category: "Aksesoris Kecil",
    description:
      "Gantungan kunci rajut motif strawberry dengan detail daun timbul. Ukuran mungil, muat di saku.",
    type: "READY_STOCK",
    skuPrefix: "AK-STR",
    basePrice: 22000,
    baseCost: 9000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: ["Merah", "Pink", "Krem"] },
    ],
  },
  {
    name: "Bros Rajut Mawar",
    category: "Aksesoris Kecil",
    description:
      "Bros rajut berbentuk mawar dengan peniti kuat, mempermanis hijab maupun tas.",
    type: "READY_STOCK",
    skuPrefix: "AK-BRS",
    basePrice: 25000,
    baseCost: 10000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_PASTEL },
    ],
  },
  {
    name: "Scrunchie Rajut Katun",
    category: "Aksesoris Kecil",
    description:
      "Ikat rambut rajut dengan karet elastis lentur, lembut dan tidak merusak rambut.",
    type: "READY_STOCK",
    skuPrefix: "AK-SCR",
    basePrice: 20000,
    baseCost: 8000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_CERAH },
    ],
  },

  // ================================ Tote Bag ================================
  {
    name: "Tote Bag Granny Square",
    category: "Tote Bag",
    description:
      "Tote bag rajut motif granny square klasik. Tali lebar sehingga nyaman di bahu, cocok untuk kuliah dan jalan santai.",
    type: "READY_STOCK",
    skuPrefix: "TB-GRN",
    basePrice: 145000,
    baseCost: 62000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_CERAH },
      { name: "Ukuran", isHaveVisual: false, values: ["M", "L"] },
    ],
    sizeSurcharge: { M: 0, L: 30000 },
  },
  {
    name: "Tote Bag Polos Katun",
    category: "Tote Bag",
    description:
      "Tote bag rajut rapat berbahan katun, bentuk simpel tanpa motif. Kuat menahan beban buku dan laptop tipis.",
    type: "READY_STOCK",
    skuPrefix: "TB-PLS",
    basePrice: 120000,
    baseCost: 52000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_DASAR },
      { name: "Ukuran", isHaveVisual: false, values: ["M", "L"] },
    ],
    sizeSurcharge: { M: 0, L: 25000 },
  },
  {
    name: "Tote Bag Mini Bunga",
    category: "Tote Bag",
    description:
      "Tote bag ukuran mini dengan aplikasi bunga rajut. Muat dompet, ponsel, dan botol minum kecil.",
    type: "READY_STOCK",
    skuPrefix: "TB-MIN",
    basePrice: 95000,
    baseCost: 40000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_PASTEL },
    ],
  },
  {
    name: "Tote Bag Jaring Market",
    category: "Tote Bag",
    description:
      "Tas jaring rajut yang melar mengikuti isi, ringan dan mudah dilipat. Andalan untuk belanja ke pasar.",
    type: "READY_STOCK",
    skuPrefix: "TB-JRG",
    basePrice: 88000,
    baseCost: 36000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: ["Krem", "Olive", "Hitam"] },
    ],
  },

  // ================================== Tas ===================================
  {
    name: "Tas Rajut Bulat Bambu",
    category: "Tas",
    description:
      "Tas rajut bentuk bulat dengan pegangan kayu bambu. Tampilan etnik yang cocok untuk acara semi formal.",
    type: "READY_STOCK",
    skuPrefix: "TS-BLT",
    basePrice: 265000,
    baseCost: 118000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: ["Krem", "Mocca", "Hitam"] },
    ],
  },
  {
    name: "Tas Rajut Tali Kur Premium",
    category: "Tas",
    description:
      "Tas rajut dari tali kur padat dengan lapisan furing dan resleting. Bentuknya kokoh dan tidak mudah melar.",
    type: "READY_STOCK",
    skuPrefix: "TS-KUR",
    basePrice: 320000,
    baseCost: 145000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_DASAR },
      { name: "Ukuran", isHaveVisual: false, values: ["M", "L"] },
    ],
    sizeSurcharge: { M: 0, L: 65000 },
  },
  {
    name: "Tas Rajut Anyaman Segitiga",
    category: "Tas",
    description:
      "Tas rajut bermotif anyaman segitiga dengan tali panjang yang bisa dilepas. Dikerjakan sesuai pesanan.",
    type: "MADE_TO_ORDER",
    skuPrefix: "TS-SGT",
    basePrice: 385000,
    baseCost: 172000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_CERAH },
    ],
  },
  {
    name: "Tas Rajut Laptop 14 Inch",
    category: "Tas",
    description:
      "Tas rajut berlapis busa untuk laptop 14 inci, dengan saku depan untuk charger dan mouse.",
    type: "PRE_ORDER",
    skuPrefix: "TS-LPT",
    basePrice: 295000,
    baseCost: 132000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: ["Navy", "Olive", "Hitam"] },
    ],
  },

  // ================================= Dompet =================================
  {
    name: "Dompet Rajut Lipat",
    category: "Dompet",
    description:
      "Dompet rajut model lipat dua dengan kancing magnet, ada sekat untuk kartu dan uang kertas.",
    type: "READY_STOCK",
    skuPrefix: "DP-LPT",
    basePrice: 78000,
    baseCost: 33000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_PASTEL },
    ],
  },
  {
    name: "Pouch Rajut Resleting",
    category: "Dompet",
    description:
      "Pouch rajut serbaguna dengan resleting halus. Pas untuk alat tulis, kosmetik, atau charger.",
    type: "READY_STOCK",
    skuPrefix: "DP-PCH",
    basePrice: 62000,
    baseCost: 26000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_CERAH },
      { name: "Ukuran", isHaveVisual: false, values: ["S", "M"] },
    ],
    sizeSurcharge: { S: 0, M: 15000 },
  },
  {
    name: "Dompet Koin Bulat",
    category: "Dompet",
    description:
      "Dompet koin rajut berbentuk bulat dengan tali gantung pendek, mudah diselipkan di tas.",
    type: "READY_STOCK",
    skuPrefix: "DP-KON",
    basePrice: 45000,
    baseCost: 18000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_PASTEL },
    ],
  },
  {
    name: "Dompet Rajut Panjang",
    category: "Dompet",
    description:
      "Dompet rajut panjang muat uang kertas tanpa dilipat, dilengkapi enam slot kartu.",
    type: "READY_STOCK",
    skuPrefix: "DP-PJG",
    basePrice: 110000,
    baseCost: 47000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_DASAR },
    ],
  },

  // =============================== Sling Bag ================================
  {
    name: "Sling Bag Rajut Minimalis",
    category: "Sling Bag",
    description:
      "Tas selempang rajut bentuk kotak sederhana dengan tali yang bisa diatur panjangnya.",
    type: "READY_STOCK",
    skuPrefix: "SB-MIN",
    basePrice: 165000,
    baseCost: 71000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_DASAR },
    ],
  },
  {
    name: "Sling Bag Rajut Motif Zigzag",
    category: "Sling Bag",
    description:
      "Sling bag rajut motif zigzag dua warna dengan furing bagian dalam agar isi tidak terlihat.",
    type: "READY_STOCK",
    skuPrefix: "SB-ZGZ",
    basePrice: 195000,
    baseCost: 84000,
    variantTypes: [
      { name: "Motif", isHaveVisual: true, values: ["Zigzag Krem", "Zigzag Navy", "Zigzag Terracotta"] },
    ],
  },
  {
    name: "Sling Bag Rajut Bucket",
    category: "Sling Bag",
    description:
      "Sling bag model bucket dengan tali serut di bagian atas. Kapasitasnya lega untuk barang harian.",
    type: "READY_STOCK",
    skuPrefix: "SB-BCK",
    basePrice: 215000,
    baseCost: 93000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_CERAH },
      { name: "Ukuran", isHaveVisual: false, values: ["M", "L"] },
    ],
    sizeSurcharge: { M: 0, L: 40000 },
  },
  {
    name: "Sling Bag Rajut Phone Holder",
    category: "Sling Bag",
    description:
      "Tas selempang mungil khusus ponsel, ada satu saku belakang untuk kartu. Praktis untuk jalan singkat.",
    type: "READY_STOCK",
    skuPrefix: "SB-PHN",
    basePrice: 85000,
    baseCost: 35000,
    variantTypes: [
      { name: "Warna", isHaveVisual: true, values: WARNA_PASTEL },
    ],
  },
];
