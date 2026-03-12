import { Module } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { CloudinaryService } from 'cloudinary/cloudinary.service';

@Module({
  providers: [
    UsersService, 
    CloudinaryService,
  ],
  controllers: [UsersController]
})
export class UsersModule {}
