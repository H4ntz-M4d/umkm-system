import { Test, TestingModule } from '@nestjs/testing';
import { PosTransactionService } from './pos-transaction.service';

describe('PosTransactionService', () => {
  let service: PosTransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PosTransactionService],
    }).compile();

    service = module.get<PosTransactionService>(PosTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
