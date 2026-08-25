import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { ResponseInterceptor } from 'common/interceptors/response.interceptors';
import { GlobalExceptionFilter } from 'common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
bootstrap();
