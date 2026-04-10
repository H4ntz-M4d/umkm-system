import { Module } from '@nestjs/common';
import { ProductionService } from './production/production.service';
import { ProductionController } from './production/production.controller';

@Module({
  providers: [ProductionService],
  controllers: [ProductionController],
})
export class ProductionModule {}
