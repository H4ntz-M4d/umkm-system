import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  CustomerAddressDto,
  UpdateCustomerAddressDto,
} from 'address/dto/address.dto';
import { toCustomerAddressResponse } from './address.response';

@Injectable()
export class AddressService {
  async findAll(customerId: bigint) {
    const data = await prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
    return data.map(toCustomerAddressResponse);
  }

  private async ownedAddress(customerId: bigint, id: bigint) {
    const address = await prisma.customerAddress.findUnique({ where: { id } });
    if (!address || address.customerId !== customerId) {
      throw new NotFoundException('Alamat tidak ditemukan');
    }
    return address;
  }

  async create(customerId: bigint, dto: CustomerAddressDto) {
    const existingCount = await prisma.customerAddress.count({
      where: { customerId },
    });

    const isDefault = dto.isDefault ?? existingCount === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          recipientName: dto.recipientName,
          phone: dto.phone,
          addressLine: dto.addressLine,
          city: dto.city,
          province: dto.province,
          isDefault,
          customerId,
        },
      });
    });

    return toCustomerAddressResponse(address);
  }

  async update(customerId: bigint, id: bigint, dto: UpdateCustomerAddressDto) {
    await this.ownedAddress(customerId, id);

    const address = await prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.customerAddress.updateMany({
          where: { customerId },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.update({ where: { id }, data: dto });
    });

    return toCustomerAddressResponse(address);
  }

  async setDefault(customerId: bigint, id: bigint) {
    await this.ownedAddress(customerId, id);

    const address = await prisma.$transaction(async (tx) => {
      await tx.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
      return tx.customerAddress.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return toCustomerAddressResponse(address);
  }

  async remove(customerId: bigint, id: bigint) {
    const address = await this.ownedAddress(customerId, id);
    await prisma.customerAddress.delete({ where: { id } });

    // Kalau yang dihapus adalah default, jadikan alamat lain (kalau ada)
    // sebagai default baru supaya checkout tidak pernah kosong tanpa alasan.
    if (address.isDefault) {
      const next = await prisma.customerAddress.findFirst({
        where: { customerId },
        orderBy: { id: 'asc' },
      });
      if (next) {
        await prisma.customerAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return toCustomerAddressResponse(address);
  }
}
