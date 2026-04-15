import { Controller, Get, Query } from '@nestjs/common';
import { InventoryLedgerService } from './inventory-ledger.service';
import { Pagination } from 'common/paginate/pagination';

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
  ) {
    return this.ledgerService.findAll(pagination, {
      search,
      itemType,
      direction,
      source,
    });
  }

  @Get('summary')
  getSummary() {
    return this.ledgerService.getSummary();
  }
}
