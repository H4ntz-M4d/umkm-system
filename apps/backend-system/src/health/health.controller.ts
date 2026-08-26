import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

/**
 * Dipakai uptime monitor, `HEALTHCHECK` Docker, dan orkestrator saat deploy
 * untuk memutuskan apakah instance ini layak menerima trafik.
 *
 * Sengaja memeriksa database, bukan sekadar membalas 200. Proses Node bisa
 * sangat hidup sementara aplikasinya tidak bisa melayani apa pun — pool
 * koneksi mati setelah Postgres di-restart, misalnya. Health check yang hanya
 * membuktikan "proses masih jalan" membuat monitor menyala hijau sementara
 * kasir tidak bisa menyelesaikan satu transaksi pun, dan itu lebih berbahaya
 * daripada tidak punya monitoring sama sekali.
 *
 * Tanpa autentikasi, karena monitor tidak bisa login. Karena itu isinya
 * sengaja miskin: cuma status, tanpa versi aplikasi, nama host database, atau
 * pesan error mentah yang bisa dipakai orang lain untuk mengintai.
 */
@SkipThrottle()
@Controller('api/v1/health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    try {
      await this.healthService.pingDatabase();
      return { status: 'ok' };
    } catch (error) {
      // Rinciannya masuk log, bukan ke jawaban HTTP.
      this.logger.error(
        `Health check gagal: ${error instanceof Error ? error.message : 'penyebab tidak diketahui'}`,
      );
      throw new ServiceUnavailableException('Service unavailable');
    }
  }
}
