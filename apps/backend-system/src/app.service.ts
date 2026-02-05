import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async findAll() {
    return await prisma.store.findMany()
  }
}
