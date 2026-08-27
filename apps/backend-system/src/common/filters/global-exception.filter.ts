import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@repo/db';
import { ZodError } from 'zod';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private mapPostgresErrorCode(code: string): {
    status: HttpStatus;
    message: string;
  } {
    switch (code) {
      case '23001': // restrict_violation
        return {
          status: HttpStatus.CONFLICT,
          message:
            'Tidak bisa menghapus data ini karena masih digunakan oleh data lain',
        };
      case '23503': // foreign_key_violation (jaga-jaga, kalau ada yang lolos dari sisi ini juga)
        return {
          status: HttpStatus.CONFLICT,
          message: 'Data terkait tidak ditemukan atau masih direferensikan',
        };
      case '23505': // unique_violation (jaga-jaga juga)
        return {
          status: HttpStatus.CONFLICT,
          message: 'Data dengan nilai ini sudah ada',
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Database operation failed',
        };
    }
  }

  private mapPrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002':
        return 'Data dengan nilai ini sudah ada';
      case 'P2025':
        return 'Data tidak ditemukan';
      default:
        return 'Database operation failed';
    }
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timeStamp = new Date().toISOString();

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: zodError.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        meta: { timeStamp },
      });
    }

    if (
      exception?.name === 'DriverAdapterError' &&
      exception?.cause?.kind === 'postgres'
    ) {
      const { status, message } = this.mapPostgresErrorCode(
        exception.cause.code,
      );
      return response.status(status).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message,
          details: {
            postgresCode: exception.cause.code,
          },
        },
        meta: { timeStamp },
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: this.mapPrismaError(exception),
          details: {
            prismaCode: exception.code,
          },
        },
        meta: {
          timeStamp,
        },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      return response.status(status).json({
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message:
            typeof res === 'string'
              ? res
              : ((res as any).message ?? 'Request failed'),
        },
        meta: {
          timeStamp,
        },
      });
    }

    // Satu-satunya tempat galat tak terduga tercatat. Jejaknya sengaja
    // lengkap di sini — metode, jalur, dan stack trace — karena yang dikirim
    // ke client di bawah sengaja tidak menjelaskan apa pun.
    this.logger.error(
      `Galat tak tertangani pada ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unexpected server error',
      },
      meta: { timeStamp },
    });
  }
}
