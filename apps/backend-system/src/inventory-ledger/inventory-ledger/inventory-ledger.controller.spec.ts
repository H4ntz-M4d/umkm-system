import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLedgerController } from './inventory-ledger.controller';

describe('InventoryLedgerController', () => {
  let controller: InventoryLedgerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryLedgerController],
    }).compile();

    controller = module.get<InventoryLedgerController>(InventoryLedgerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
