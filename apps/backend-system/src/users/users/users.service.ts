import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { prisma, UserRole } from '@repo/db';
import { CreateEmployeeDto, CreateUsersDto, UpdateUsersDto } from 'users/dto/dto.users';
import * as bcrypt from 'bcrypt';
import { Pagination } from 'common/paginate/pagination';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';

@Injectable()
export class UsersService {
  constructor(
    private cloudinaryService: CloudinaryService
  ) {

  }

  // ------------------------------- Admin ------------------------------------
  async findAllAdmin(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0
    const limit = pagination.limit ?? 10
    const data = await prisma.users.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        role: {
          in: ['ADMIN', 'GUDANG', 'KASIR', 'OWNER']
        },
        name: {
          contains: search,
          mode: 'insensitive'
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
    const user = await prisma.users.findFirst({
      where: { id },
      select: {
        id: true,
        isActive: true,
        storeId: true,
        role: true,
        password: true,
      }
    })

    const employee = await prisma.employee.findFirst({
      where: { usersId: user?.id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        phone: true,
        image: true,
      }
    })

    return {
      success: true,
      data: {
        id: user?.id,
        name: employee?.name,
        email: employee?.email,
        address: employee?.address,
        phone: employee?.phone,
        image: employee?.image,
        isActive: user?.isActive,
        storeId: user?.storeId,
        role: user?.role,

      },
      meta: {
        timestamps: new Date().toISOString()
      }
    }
  }

  async createAdmin(data: CreateEmployeeDto, file?: Express.Multer.File) {
    const userIsExist = await prisma.users.count({
      where: {
        email: data.email
      }
    })

    if (userIsExist != 0) {
      throw new HttpException("Users is already exist", 400)
    }

    let image: string | undefined;

    if (file) {
      image = await this.cloudinaryService.uploadImage(file, CloudinaryFolder.PROFILES)
    }

    if (data.role === UserRole.CUSTOMER) {
      throw new BadRequestException("Invalid request Role User")
    }

    data.password = await bcrypt.hash(data.password, 10)

    const user = await prisma.users.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
        storeId: data.storeId
      }
    })

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        phone: data.phone,
        image: image,
        usersId: user.id
      }
    })

    return {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    }
  }

  async update(id: bigint, data: UpdateUsersDto, file?: Express.Multer.File) {
    const employeeIsExist = await prisma.employee.findUnique({
      where: {
        usersId: id
      }
    })

    // if (userIsExist != 0) {
    //   throw new HttpException("Users is already exist", 400)
    // }

    let image = employeeIsExist?.image;

    if (file) {
      image = await this.cloudinaryService.uploadImage(file, CloudinaryFolder.PROFILES)

      if (employeeIsExist?.image) {
        await this.cloudinaryService.deleteImage(employeeIsExist.image)
      }
    }

    if (data.image === "") {
      if (employeeIsExist?.image) {
        await this.cloudinaryService.deleteImage(employeeIsExist.image)
      }

      image = undefined
    }

    if (data.role === UserRole.CUSTOMER) {
      throw new BadRequestException("Invalid request Role User")
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10)
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
        storeId: data.storeId
      }
    })

    const employee = await prisma.employee.update({
      where: { usersId: user.id },
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        phone: data.phone,
        image: image,
        usersId: user.id
      }
    })

    return {
      name: employee.name,
      email: employee.email,
      address: employee.address,
      phone: employee.phone,
      image: employee.image,
      role: user.role
    }
  }

  async remove(id: bigint) {
    const employeeIsExist = await prisma.employee.findUnique({
      where: { usersId: id }
    })

    if (employeeIsExist?.image) {
      await this.cloudinaryService.deleteImage(employeeIsExist.image)
    }

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
