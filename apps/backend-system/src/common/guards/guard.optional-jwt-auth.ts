import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Seperti `JwtAuthGuard`, tapi tidak pernah menolak.
 *
 * Dipakai rute yang memang dirancang publik dan boleh diakses tamu maupun
 * customer yang sudah masuk — pengajuan pesanan dari katalog. Kalau tokennya
 * ada dan sah, `req.user` terisi sehingga pesanan bisa ditautkan ke akunnya;
 * kalau tidak, kosong, dan pemesan tetap boleh lanjut dengan mengisi nama
 * serta nomor WhatsApp.
 *
 * Yang berubah hanyalah jawaban atas "tidak ada sesi yang sah": dari 401
 * menjadi "diperlakukan sebagai tamu". Verifikasi tanda tangan dan masa
 * berlaku tetap dikerjakan passport-jwt SEBELUM `handleRequest` dipanggil,
 * jadi token palsu atau kedaluwarsa menghasilkan `null` — bukan identitas
 * yang dipercaya. Tidak ada jalur di mana token rusak mengisi `req.user`.
 *
 * Token basi juga sengaja ditelan, bukan dijadikan 401: tamu adalah warga
 * kelas satu di rute ini, jadi sesi yang kedaluwarsa di tab yang lama terbuka
 * tidak boleh menggagalkan pemesanan. Konsekuensinya pesanan itu tercatat
 * sebagai pesanan tamu — tetap lengkap dengan nama dan nomor WhatsApp, hanya
 * tidak tertaut ke akunnya.
 *
 * Konsekuensi lain: `@AuthUser()` TIDAK boleh dipakai pada rute yang memakai
 * guard ini — decorator itu melempar 401 saat `req.user` kosong. Pakai
 * `@OptionalAuthUser()`.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: unknown): TUser {
    return (user ?? null) as TUser;
  }
}
