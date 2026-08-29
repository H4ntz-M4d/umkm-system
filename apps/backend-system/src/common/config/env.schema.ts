import { z } from 'zod';

/// Teks yang harus ada dan tidak boleh kosong. Pesannya diseragamkan supaya
/// yang terbaca "wajib diisi", bukan "expected string, received undefined".
const wajib = () => z.string({ error: 'wajib diisi' }).min(1, 'wajib diisi');

/// Menerima "true"/"false" dari env — semua nilai env selalu berupa teks.
const booleanFromEnv = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const baseSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(6500),

  DATABASE_URL: wajib().refine(
      (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      'harus dimulai dengan postgresql://',
    ),

  JWT_SECRET: wajib(),
  JWT_EXPIRES_IN: z.string().default('15m'),

  CLOUDINARY_NAME: wajib(),
  CLOUDINARY_API_KEY: wajib(),
  CLOUDINARY_API_SECRET: wajib(),

  MIDTRANS_SERVER_KEY: wajib(),
  MIDTRANS_API_KEY: wajib(),
  MIDTRANS_IS_PRODUCTION: booleanFromEnv.default(false),

  FRONTEND_URL: z.url('harus berupa URL lengkap, mis. https://nurfacraft.com'),

  /**
   * Daftar origin yang boleh memanggil API, dipisah koma.
   *
   * Kalau kosong, `FRONTEND_URL` dipakai sebagai satu-satunya origin. Nilai
   * `*` sengaja tidak didukung: API ini mengirim cookie sesi, dan origin
   * terbuka berarti situs mana pun boleh memintanya atas nama pengguna.
   */
  CORS_ORIGINS: z.string().optional(),

  /// Jumlah proxy di depan backend. Lihat penjelasan di main.ts.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),

  /**
   * Menyalakan atribut Secure pada cookie sesi. Kosongkan saja — nilainya
   * mengikuti NODE_ENV, yang hampir selalu benar.
   */
  COOKIE_SECURE: booleanFromEnv.optional(),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional(),

  // SMTP opsional: tanpa ini fitur email mati, tapi sisa aplikasi tetap jalan.
  // MailService sudah memeriksa ketiganya sebelum membuat transporter.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

/**
 * Pemeriksaan yang hanya masuk akal jika beberapa nilai dilihat bersamaan.
 *
 * Di sinilah kesalahan go-live yang paling khas tertangkap: berhasil deploy ke
 * produksi, tapi kunci Midtrans-nya masih sandbox. Aplikasinya jalan normal —
 * hanya saja tidak ada pembayaran sungguhan yang pernah berhasil, dan itu baru
 * ketahuan dari pelanggan.
 */
const envSchema = baseSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== 'production') return;

  if (!env.MIDTRANS_IS_PRODUCTION) {
    ctx.addIssue({
      code: 'custom',
      path: ['MIDTRANS_IS_PRODUCTION'],
      message:
        'harus true saat NODE_ENV=production — kunci sandbox tidak bisa memproses pembayaran sungguhan',
    });
  }

  if (env.COOKIE_SECURE === false) {
    ctx.addIssue({
      code: 'custom',
      path: ['COOKIE_SECURE'],
      message:
        'tidak boleh false di produksi — cookie sesi akan ikut terkirim lewat koneksi tanpa HTTPS',
    });
  }

  // Panjang minimum hanya dipaksakan di produksi supaya lingkungan
  // pengembangan yang sudah berjalan tidak mendadak berhenti. Untuk HS256,
  // kunci di bawah 32 karakter jauh lebih murah ditebak daripada kelihatannya.
  if (env.JWT_SECRET.length < 32) {
    ctx.addIssue({
      code: 'custom',
      path: ['JWT_SECRET'],
      message: `minimal 32 karakter di produksi (sekarang ${env.JWT_SECRET.length})`,
    });
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * Dijalankan ConfigModule sebelum aplikasi menerima permintaan pertama.
 *
 * Gunanya menggeser kegagalan dari saat pemakaian ke saat start. Tanpa ini,
 * `MIDTRANS_SERVER_KEY` yang lupa diisi membuat tanda tangan webhook dihitung
 * dengan teks "undefined" — tidak pernah cocok, semua notifikasi ditolak, dan
 * seluruh sisa aplikasi tetap terlihat sehat.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const rincian = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.').padEnd(24)}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n\nKonfigurasi lingkungan tidak valid:\n\n${rincian}\n\n` +
        `Periksa berkas .env — daftar lengkapnya ada di .env.example\n`,
    );
  }

  return parsed.data;
}
