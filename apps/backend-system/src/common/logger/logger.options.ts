import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Konfigurasi logging terstruktur.
 *
 * Di produksi keluarannya JSON satu baris per kejadian, supaya bisa dicari
 * dengan `grep`/`jq` atau dikirim ke agregator log tanpa parsing khusus. Di
 * development dilewatkan `pino-pretty` supaya tetap enak dibaca manusia —
 * paketnya sengaja devDependency, karena itu transport-nya hanya dipasang saat
 * bukan produksi.
 */
export const loggerOptions: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),

    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
        },

    /**
     * Yang TIDAK boleh ikut tercatat.
     *
     * Log yang membocorkan token sesi lebih berbahaya daripada tidak ada log
     * sama sekali: berkas log berpindah tangan jauh lebih gampang daripada
     * akses database, dan token yang bocor bisa dipakai langsung tanpa
     * menembus apa pun.
     *
     * `set-cookie` yang paling mudah terlewat — di situlah access token dan
     * refresh token dikirim balik ke browser tiap kali seseorang login.
     */
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'res.headers["set-cookie"]',
        'req.body.password',
        'req.body.newPassword',
        'req.body.confirmPassword',
        'req.body.code',
      ],
      censor: '[REDACTED]',
    },

    /**
     * Yang benar-benar dicatat per permintaan.
     *
     * Bawaan pino-http menuliskan SELURUH header permintaan dan respons —
     * belasan baris helmet dan cache untuk tiap satu permintaan. Log yang
     * terlalu berisik sama tidak bergunanya dengan log yang tidak ada, karena
     * yang penting tenggelam di antara yang tidak.
     *
     * Redaksi di atas tetap dipertahankan sebagai jaring pengaman: kalau suatu
     * saat header dikembalikan ke sini, rahasianya sudah tersaring lebih dulu.
     */
    serializers: {
      req: (req: { id: string; method: string; url: string; remoteAddress?: string }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        // Dipertahankan karena inilah yang dicari saat menelusuri
        // penyalahgunaan — siapa yang menembaki endpoint login, misalnya.
        ip: req.remoteAddress,
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },

    /// Satu id per permintaan, supaya baris "masuk", "keluar", dan galat yang
    /// menyertainya bisa disatukan kembali saat menelusuri masalah.
    genReqId: (req: IncomingMessage) =>
      (req.headers['x-request-id'] as string) ?? randomUUID(),

    /**
     * Health check tidak ikut dicatat.
     *
     * Uptime monitor dan HEALTHCHECK Docker memanggilnya tiap beberapa puluh
     * detik. Kalau ikut tercatat, log produksi hanya akan berisi itu dan
     * kejadian yang benar-benar penting tenggelam di antaranya.
     */
    autoLogging: {
      ignore: (req: IncomingMessage) => req.url === '/api/v1/health',
    },

    /// Status HTTP menentukan tingkat keparahan, supaya `level>=error` benar
    /// benar berarti "ada yang rusak", bukan sekadar lalu lintas biasa.
    customLogLevel: (
      _req: IncomingMessage,
      res: ServerResponse,
      err?: Error,
    ) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  },
};
