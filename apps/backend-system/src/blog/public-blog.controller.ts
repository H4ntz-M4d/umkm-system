import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicBlogQueryDto } from 'blog/dto/blog.dto';
import { BlogService } from './blog.service';

/**
 * Blog untuk storefront.
 *
 * Sengaja tanpa guard, sama seperti katalog publik: semuanya baca saja, dan
 * yang dibalas hanya tulisan yang sudah terbit.
 */
@Controller('api/v1/public/blog')
export class PublicBlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get('/categories')
  categories() {
    return this.blogService.findPublicCategories();
  }

  @Get()
  findAll(@Query() query: PublicBlogQueryDto) {
    return this.blogService.findPublic(query);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findPublicBySlug(slug);
  }
}
