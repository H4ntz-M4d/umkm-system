import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from 'stores/dto/dto.store';
import { Pagination } from 'common/paginate/pagination';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('/api/v1/stores')
export class StoresController {
  constructor(private service: StoresService) {}

  @Get()
  findAll(@Query() pagination: Pagination) {
    return this.service.findAll(pagination);
  }

  @Get('/list')
  findAllStore() {
    return this.service.findAllStore();
  }

  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.service.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.service.remove(id);
  }
}
