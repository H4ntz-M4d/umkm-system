import { Module } from '@nestjs/common';
import { MaterialsService } from './materials/materials.service';
import { MaterialsController } from './materials/materials.controller';

@Module({
  providers: [MaterialsService],
  controllers: [MaterialsController],
})
export class MaterialModule {}
