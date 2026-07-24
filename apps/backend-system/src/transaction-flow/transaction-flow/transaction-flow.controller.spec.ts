import { Test, TestingModule } from '@nestjs/testing';
import { TransactionFlowController } from './transaction-flow.controller';

describe('TransactionFlowController', () => {
  let controller: TransactionFlowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionFlowController],
    }).compile();

    controller = module.get<TransactionFlowController>(TransactionFlowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
