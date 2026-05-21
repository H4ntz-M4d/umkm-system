import { Test, TestingModule } from '@nestjs/testing';
import { PosTransactionController } from './pos-transaction.controller';

describe('PosTransactionController', () => {
  let controller: PosTransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosTransactionController],
    }).compile();

    controller = module.get<PosTransactionController>(PosTransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
