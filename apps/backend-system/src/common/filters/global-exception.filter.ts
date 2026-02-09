import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@repo/db";
import { ZodError } from "zod";
import { Request, Response } from 'express';
import { ZodValidationException } from "nestjs-zod";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private mapPrismaError(
        exception: Prisma.PrismaClientKnownRequestError,
    ): string {
        switch (exception.code) {
            case 'P2002':
                return 'Unique constraint violation';
            case 'P2025':
                return 'Record not found';
            default:
                return 'Database operation failed';
        }

    }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const timestamp = new Date().toISOString()

        if (exception instanceof ZodValidationException) {
            const zodError = exception.getZodError() as ZodError;
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: zodError.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                meta: { timestamp }
            });
        }

        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            return response.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: this.mapPrismaError(exception),
                    details: {
                        prismaCode: exception.code
                    }

                },
                meta: {
                    timestamp
                }
            })
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus()
            const res = exception.getResponse()

            return response.status(status).json({
                success: false,
                error: {
                    code: 'HTTP_ERROR',
                    message: typeof res === 'string' ? res : (res as any).message ?? 'Request failed'
                },
                meta: {
                    timestamp
                }
            })
        }

        console.error('[UNHANDLED_EXCEPTION]', exception);

        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unexpected server error',
            },
            meta: { timestamp },
        });

    }
}