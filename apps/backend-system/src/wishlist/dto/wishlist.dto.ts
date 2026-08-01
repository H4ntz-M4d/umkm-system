import { createZodDto } from 'nestjs-zod';
import { ToggleWishlistSchema } from '@repo/schemas';

export class ToggleWishlistDto extends createZodDto(ToggleWishlistSchema) {}
