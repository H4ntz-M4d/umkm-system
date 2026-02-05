import { Module } from '@nestjs/common';
import { StoresService } from './stores/stores.service';
import { StoresController } from './stores/stores.controller';

@Module({
  providers: [StoresService],
  controllers: [StoresController]
})
export class StoresModule {}
