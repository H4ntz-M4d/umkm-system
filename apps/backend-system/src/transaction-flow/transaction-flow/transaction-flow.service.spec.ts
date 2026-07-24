import { Test, TestingModule } from '@nestjs/testing';
import { TransactionFlowService } from './transaction-flow.service';

describe('TransactionFlowService', () => {
  let service: TransactionFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionFlowService],
    }).compile();

    service = module.get<TransactionFlowService>(TransactionFlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
