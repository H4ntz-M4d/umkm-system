import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@repo/db';
import { Roles } from 'common/decorator/roles.decorator';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import {
  BespokeOrderDto,
  BespokeQueryDto,
  UpdateBespokeStatusDto,
} from 'bespoke/dto/bespoke.dto';
import { BespokeService } from './bespoke.service';
import { CentralStoreOnly } from 'common/decorator/central-store.decorator';
import { CentralStoreGuard } from 'common/guards/guard.central-store';

/**
 * Pesanan custom per pembeli — dulu menumpang sebagai "tipe produksi".
 *
 * Owner dan Admin saja: ini menyangkut harga yang disepakati dengan pembeli
 * dan pencatatan kas, bukan pekerjaan gudang.
 */
@UseGuards(JwtAuthGuard, RolesGuard, CentralStoreGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/bespoke')
export class BespokeController {
  constructor(private readonly bespokeService: BespokeService) {}

  @Get()
  findAll(@Query() query: BespokeQueryDto) {
    return this.bespokeService.findAll(query);
  }

  /// Didaftarkan sebelum rute berparameter agar "summary" tidak tertangkap
  /// sebagai sebuah id.
  @Get('/summary')
  summary() {
    return this.bespokeService.summary();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: bigint) {
    return this.bespokeService.findOne(BigInt(id));
  }

  @CentralStoreOnly()
  @Post()
  create(@Body() data: BespokeOrderDto) {
    return this.bespokeService.create(data);
  }

  @CentralStoreOnly()
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: bigint, @Body() data: BespokeOrderDto) {
    return this.bespokeService.update(BigInt(id), data);
  }

  @CentralStoreOnly()
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateBespokeStatusDto,
  ) {
    return this.bespokeService.updateStatus(BigInt(id), data);
  }

  @CentralStoreOnly()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.bespokeService.remove(BigInt(id));
  }
}
