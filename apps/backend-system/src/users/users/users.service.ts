import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateUsersDto, UpdateUsersDto } from 'users/dto/dto.users';

@Injectable()
export class UsersService {
  async findAll() {
    return await prisma.users.findMany();
  }

  async findById(id: bigint) {
    return await prisma.users.findFirst({
      where: { id },
    });
  }

  async create(data: CreateUsersDto) {
    return await prisma.users.create({
      data: data,
    });
  }

  async update(id: bigint, data: UpdateUsersDto) {
    return await prisma.users.update({
      where: { id },
      data: data,
    });
  }

  async remove(id: bigint) {
    return await prisma.users.delete({
      where: { id },
    });
  }
}
