import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { ResponseInterceptor } from 'common/interceptors/response.interceptors';
import { GlobalExceptionFilter } from 'common/filters/global-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe())
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.use(cookieParser())
  app.enableCors({
    origin: "http://localhost:3000",
    credentials: true
  })

  await app.listen(process.env.PORT ?? 3001);
}

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
bootstrap();
