import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { ResponseInterceptor } from 'common/interceptors/response.interceptors';
import { GlobalExceptionFilter } from 'common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  /**
   * `bufferLogs` menahan log yang terbit sebelum logger sungguhan siap, lalu
   * mengeluarkannya lewat logger itu. Tanpa ini, semua yang terjadi selama
   * bootstrap tercetak dengan format bawaan Nest dan luput dari redaksi.
   */
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  /// Mengganti logger bawaan Nest, sehingga `new Logger()` dari '@nestjs/common'
  /// di seluruh kode ikut menulis terstruktur tanpa perlu diubah satu per satu.
  app.useLogger(app.get(Logger));

  /**
   * Jumlah proxy di depan backend — bukan sakelar nyala/mati.
   *
   * Seluruh trafik browser sampai ke sini lewat `rewrites()` Next.js, jadi
   * tanpa ini `req.ip` selalu berisi alamat proxy dan rate limiting akan
   * memperlakukan semua pengunjung sebagai satu orang.
   *
   * Sengaja berupa angka, bukan `true`: `true` mempercayai `X-Forwarded-For`
   * apa pun yang dikirim client, sehingga batasnya bisa dilewati cukup dengan
   * memalsukan header. Angkanya harus dinaikkan kalau nanti ada reverse proxy
   * lain (Traefik/Caddy) di depan Next.js.
   */
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));

  app.use(helmet());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:3000', 'http://192.168.100.31:3000'],
    credentials: true,
  });

  /**
   * Berhenti dengan rapi saat SIGTERM — sinyal yang dikirim tiap kali container
   * di-redeploy atau server di-restart.
   *
   * Perilaku bawaan Node adalah mati seketika: request yang sedang berjalan
   * putus di tengah, dan pool koneksi database ditinggalkan menggantung.
   * Dengan ini Nest berhenti menerima koneksi baru, menyelesaikan yang sedang
   * jalan, lalu memanggil `onApplicationShutdown` di seluruh modul — termasuk
   * `PrismaShutdownService` yang menutup pool.
   *
   * Bersama endpoint /health, inilah yang memungkinkan deploy tanpa downtime:
   * health check menjaga pintu masuk, shutdown rapi menjaga pintu keluar.
   */
  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
bootstrap();
