import { PosTransactionSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CreatePosTransactionDto extends createZodDto(
  PosTransactionSchema,
) {}
