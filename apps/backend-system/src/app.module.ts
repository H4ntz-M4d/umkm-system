import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [StoresModule, UsersModule, AuthModule, CloudinaryModule]
})
export class AppModule {}
