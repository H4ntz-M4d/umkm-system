import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Pagination } from 'common/paginate/pagination';
import { MaterialsService } from 'material/materials/materials.service';
import {
  CreateMaterialsDto,
  UpdateMaterialsDto,
} from 'material/dto/materials.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/materials')
export class MaterialsController {
  constructor(private materialService: MaterialsService) {}

  @Get()
  findAll(@Query() pagination: Pagination, @Query('search') search?: string) {
    return this.materialService.findAll(pagination, search);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: bigint) {
    return this.materialService.findById(id);
  }

  @Post()
  create(@Body() data: CreateMaterialsDto) {
    return this.materialService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateMaterialsDto,
  ) {
    return this.materialService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.materialService.remove(id);
  }
}
