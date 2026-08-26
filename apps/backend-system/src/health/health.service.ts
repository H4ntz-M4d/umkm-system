import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';

/// Batas tunggu pemeriksaan database.
///
/// Bukan sekadar kehati-hatian: kegagalan database yang paling menyusahkan
/// bukan koneksi yang ditolak — itu gagal seketika — melainkan koneksi yang
/// menggantung. Tanpa batas ini, health check ikut menggantung dan monitor
/// hanya melihat timeout, bukan jawaban "tidak sehat" yang tegas.
const DB_PING_TIMEOUT_MS = 3_000;

@Injectable()
export class HealthService {
  /**
   * Melempar bila database tidak bisa dijangkau dalam batas waktu.
   *
   * Query-nya sengaja `SELECT 1` dan bukan sesuatu yang berarti: pemeriksaan
   * ini dijalankan tiap beberapa puluh detik selama berbulan-bulan, jadi
   * biayanya harus mendekati nol.
   */
  async pingDatabase(): Promise<void> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Database ping timed out')),
        DB_PING_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
    } finally {
      // Tanpa ini proses menahan timer yang sudah tidak berguna, dan shutdown
      // rapi jadi tertunda sampai timer-nya jatuh tempo.
      clearTimeout(timer);
    }
  }
}
