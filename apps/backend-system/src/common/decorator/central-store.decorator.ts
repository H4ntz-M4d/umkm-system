import { SetMetadata } from '@nestjs/common';

export const CENTRAL_STORE_KEY = 'centralStoreOnly';

/**
 * Menandai endpoint yang hanya boleh dijalankan orang pusat.
 *
 * Dipakai pada data master — produk, kategori, toko, karyawan, produksi,
 * pesanan custom, dan kiriman stok. Cabang berdiri sendiri dan hanya membeli
 * ke pusat; kalau mereka bisa menambah produk atau mengubah kategori, katalog
 * yang sama akan bercabang isinya tanpa ada yang menyepakati.
 *
 * Perannya tetap diatur `@Roles` seperti biasa — penanda ini menambah syarat
 * TOKO, bukan menggantikan syarat peran.
 */
export const CentralStoreOnly = () => SetMetadata(CENTRAL_STORE_KEY, true);
