/**
 * Sumber kebenaran tunggal untuk "role mana boleh membuka halaman mana".
 *
 * Dipakai di dua tempat sekaligus supaya aturannya tidak pernah berbeda:
 *  1. `src/proxy.ts` — menolak akses lewat URL dan melempar ke halaman 404.
 *  2. Sidebar manajemen — menyembunyikan menu yang tidak boleh diakses.
 *
 * Pembatasan di sini murni soal navigasi. Otorisasi sebenarnya tetap milik
 * `@Roles()` di controller NestJS; keduanya harus dijaga tetap sejalan.
 */

export const MANAGEMENT_ROLES = ["OWNER", "ADMIN", "KASIR", "GUDANG"] as const;

export type ManagementRole = (typeof MANAGEMENT_ROLES)[number];

/// Area yang tunduk pada aturan di bawah. Path di luar ini tidak disentuh
/// (halaman publik, login, dan sebagainya).
const PROTECTED_PREFIXES = ["/management", "/point-of-sale"];

/**
 * Kunci ditulis sebagai prefix, jadi halaman turunan mewarisi izin induknya:
 * `/management/products/new` dan `/management/products/123/edit` ikut aturan
 * `/management/products`.
 */
const ROUTE_ACCESS: Record<string, readonly ManagementRole[]> = {
  "/management/dashboard": ["OWNER", "ADMIN", "KASIR", "GUDANG"],

  // Kasir
  "/point-of-sale": ["OWNER", "ADMIN", "KASIR"],
  "/management/order-transaction": ["OWNER", "ADMIN", "KASIR"],

  // Gudang
  "/management/categories": ["OWNER", "ADMIN", "GUDANG"],
  "/management/products": ["OWNER", "ADMIN", "GUDANG"],
  "/management/production": ["OWNER", "ADMIN", "GUDANG"],
  "/management/inventory-ledger": ["OWNER", "ADMIN", "GUDANG"],
  "/management/low-stock": ["OWNER", "ADMIN", "GUDANG"],
  "/management/stock-transfer": ["OWNER", "ADMIN", "GUDANG"],

  // Owner & Admin
  "/management/expense": ["OWNER", "ADMIN"],
  "/management/stores": ["OWNER", "ADMIN"],
  "/management/employee": ["OWNER", "ADMIN"],
  "/management/customer": ["OWNER", "ADMIN"],
  "/management/payment-method": ["OWNER", "ADMIN"],
  "/management/transaction-flow": ["OWNER", "ADMIN"],
  "/management/reports": ["OWNER", "ADMIN"],
};

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isManagementRole(
  role: string | undefined | null,
): role is ManagementRole {
  return MANAGEMENT_ROLES.includes(role as ManagementRole);
}

/**
 * Mengambil aturan dengan prefix terpanjang yang cocok, sehingga aturan yang
 * lebih spesifik selalu menang atas yang lebih umum.
 */
export function rolesForPath(
  pathname: string,
): readonly ManagementRole[] | undefined {
  const match = Object.keys(ROUTE_ACCESS)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];

  return match ? ROUTE_ACCESS[match] : undefined;
}

/**
 * Halaman di area terlindungi yang belum terdaftar sengaja ditolak, bukan
 * dibiarkan lolos: halaman baru yang lupa didaftarkan lebih baik terlihat
 * tertutup saat dikembangkan daripada diam-diam terbuka untuk semua role.
 */
export function canAccessPath(
  pathname: string,
  role: string | undefined | null,
): boolean {
  if (!isProtectedPath(pathname)) return true;
  if (!isManagementRole(role)) return false;

  const allowedRoles = rolesForPath(pathname);
  if (!allowedRoles) return false;

  return allowedRoles.includes(role);
}
