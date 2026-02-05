import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [StoresModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
