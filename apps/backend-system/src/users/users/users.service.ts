import { HttpException, Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CreateUsersDto, UpdateUsersDto } from 'users/dto/dto.users';
import * as bcrypt from 'bcrypt';
import { Pagination } from 'common/paginate/pagination';

@Injectable()
export class UsersService {

  // ------------------------------- Admin ------------------------------------
  async findAllAdmin(pagination: Pagination) {
    const skip = pagination.skip ?? 0
    const limit = pagination.limit ?? 10
    const data = await prisma.users.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        role: {
          in: ['ADMIN', 'GUDANG', 'KASIR', 'OWNER']
        }
      },
      omit: {
        password: true,
        refreshToken: true
      }
    })

    const total = await prisma.users.count({
      where: {
        role: {
          in: ['ADMIN', 'GUDANG', 'KASIR', 'OWNER']
        }
      }
    })
    return {
      success: true,
      data,
      meta: {
        skip,
        limit,
        total,
        timestamp: new Date().toISOString()
      }
    }
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

  // ------------------------------- Customer ------------------------------------
  async findAllCustomer(pagination: Pagination) {
    const skip = pagination.skip ?? 0
    const limit = pagination.limit ?? 10
    const data = await prisma.users.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        role: 'CUSTOMER'
      },
      omit: {
        password: true,
        refreshToken: true
      }
    })

    const total = await prisma.users.count({
      where: {
        role: 'CUSTOMER'
      }
    })
    return {
      success: true,
      data,
      meta: {
        skip,
        limit,
        total,
        timestamp: new Date().toISOString()
      }
    }
  }


}
