import { HttpException, Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateUsersDto, UpdateUsersDto } from 'users/dto/dto.users';
import * as bcrypt from 'bcrypt';

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
    const userIsExist = await prisma.users.count({
      where: {
        email: data.email
      }
    })

    if (userIsExist != 0) {
      throw new HttpException("Users is already exist", 400)
    }

    data.password = await bcrypt.hash(data.password, 10)

    const user = await prisma.users.create({
      data: data
    })

    return {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
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
