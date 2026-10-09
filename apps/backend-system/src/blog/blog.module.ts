import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'cloudinary/cloudinary.module';
import { BlogController } from './blog.controller';
import { PublicBlogController } from './public-blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [BlogController, PublicBlogController],
  providers: [BlogService],
})
export class BlogModule {}
