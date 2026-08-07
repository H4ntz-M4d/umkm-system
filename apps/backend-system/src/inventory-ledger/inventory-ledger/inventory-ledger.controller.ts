import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InventoryLedgerService } from './inventory-ledger.service';
import { Pagination } from 'common/paginate/pagination';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
@Controller('api/v1/inventory-ledger')
export class InventoryLedgerController {
  constructor(private ledgerService: InventoryLedgerService) {}

  @Get()
  findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('itemType') itemType?: string,
    @Query('direction') direction?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.ledgerService.findAll(pagination, {
      search,
      itemType,
      direction,
      source,
      dateFrom,
      dateTo,
    });
  }

  @Get('/summary')
  getSummary() {
    return this.ledgerService.getSummary();
  }
}
