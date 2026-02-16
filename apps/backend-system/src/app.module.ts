import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [StoresModule, UsersModule, AuthModule]
})
export class AppModule {}
