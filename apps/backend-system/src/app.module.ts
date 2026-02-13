import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [StoresModule, UsersModule]
})
export class AppModule {}
