import { createZodDto } from 'nestjs-zod';
import { PublicProductQuerySchema } from '@repo/schemas';

export class PublicProductQueryDto extends createZodDto(
  PublicProductQuerySchema,
) {}
