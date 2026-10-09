import { createZodDto } from 'nestjs-zod';
import {
  BlogCategorySchema,
  BlogQuerySchema,
  BlogSchema,
  PublicBlogQuerySchema,
} from '@repo/schemas';

export class BlogDto extends createZodDto(BlogSchema) {}
export class BlogCategoryDto extends createZodDto(BlogCategorySchema) {}
export class BlogQueryDto extends createZodDto(BlogQuerySchema) {}
export class PublicBlogQueryDto extends createZodDto(PublicBlogQuerySchema) {}
