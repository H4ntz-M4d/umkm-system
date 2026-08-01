import { NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';

export async function resolveCustomerId(userId: bigint): Promise<bigint> {
  const customer = await prisma.customer.findUnique({
    where: { userId: BigInt(userId) },
    select: { id: true },
  });

  if (!customer) {
    throw new NotFoundException('Profil customer tidak ditemukan');
  }

  return customer.id;
}
