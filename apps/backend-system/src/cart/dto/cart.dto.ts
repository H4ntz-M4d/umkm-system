import { createZodDto } from 'nestjs-zod';
import {
  AddCartItemSchema,
  MergeCartSchema,
  UpdateCartItemSchema,
} from '@repo/schemas';

export class AddCartItemDto extends createZodDto(AddCartItemSchema) {}
export class UpdateCartItemDto extends createZodDto(UpdateCartItemSchema) {}
export class MergeCartDto extends createZodDto(MergeCartSchema) {}
