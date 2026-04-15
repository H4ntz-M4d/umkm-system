import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLedgerService } from './inventory-ledger.service';

describe('InventoryLedgerService', () => {
  let service: InventoryLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryLedgerService],
    }).compile();

    service = module.get<InventoryLedgerService>(InventoryLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
