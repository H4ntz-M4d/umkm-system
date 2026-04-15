import { Module } from '@nestjs/common';
import { InventoryLedgerService } from './inventory-ledger/inventory-ledger.service';
import { InventoryLedgerController } from './inventory-ledger/inventory-ledger.controller';

@Module({
  providers: [InventoryLedgerService],
  controllers: [InventoryLedgerController]
})
export class InventoryLedgerModule {}
