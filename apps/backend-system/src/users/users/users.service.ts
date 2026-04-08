import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { prisma, UserRole } from '@repo/db';
import { CreateEmployeeDto, UpdateUsersDto } from 'users/dto/dto.users';
import * as bcrypt from 'bcrypt';
import { Pagination } from 'common/paginate/pagination';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import {
  toEmployeeResponse,
  toUsersCustomersResponse,
  toUsersEmployeeResponse,
  toUsersWithEmployeeResponse,
} from 'users/users/users.response';

@Injectable()
export class UsersService {
  constructor(private cloudinaryService: CloudinaryService) {}

  // ------------------------------- Admin ------------------------------------
  async findAllAdmin(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const data = await prisma.users.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        role: {
          in: ['ADMIN', 'GUDANG', 'KASIR', 'OWNER'],
        },
        employees: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      omit: {
        password: true,
        refreshToken: true,
      },
      include: {
        employees: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    const total = await prisma.users.count({
      where: {
        role: {
          in: ['ADMIN', 'GUDANG', 'KASIR', 'OWNER'],
        },
      },
    });

    const result = data.map(toUsersEmployeeResponse);
    return {
      success: true,
      data: result,
      meta: {
        skip,
        limit,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async findById(id: bigint) {
    const user = await prisma.users.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        employees: {
          select: {
            name: true,
            address: true,
            phone: true,
            image: true,
          },
        },
        isActive: true,
        storeId: true,
        role: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', 404);
    }

    const result = toUsersWithEmployeeResponse(user);
    return result;
  }

  async createAdmin(data: CreateEmployeeDto, file?: Express.Multer.File) {
    const userIsExist = await prisma.users.count({
      where: {
        email: data.email,
      },
    });

    if (userIsExist != 0) {
      throw new HttpException('Users is already exist', 400);
    }

    let image: string | undefined;

    if (file) {
      image = await this.cloudinaryService.uploadImage(
        file,
        CloudinaryFolder.PROFILES,
      );
    }

    if (data.role === UserRole.CUSTOMER) {
      throw new BadRequestException('Invalid request Role User');
    }

    data.password = await bcrypt.hash(data.password, 10);

    const user = await prisma.users.create({
      data: {
        email: data.email,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
        storeId: data.storeId,
      },
      // omit: {
      //   password: true,
      //   refreshToken: true,
      // },
    });

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        image: image,
        userId: user.id,
      },
    });
    const result = toEmployeeResponse(employee);

    return result;
  }

  async update(id: bigint, data: UpdateUsersDto, file?: Express.Multer.File) {
    const employeeIsExist = await prisma.employee.findUnique({
      where: {
        userId: id,
      },
    });

    // if (userIsExist != 0) {
    //   throw new HttpException("Users is already exist", 400)
    // }

    let image = employeeIsExist?.image;

    if (file) {
      image = await this.cloudinaryService.uploadImage(
        file,
        CloudinaryFolder.PROFILES,
      );

      if (employeeIsExist?.image) {
        await this.cloudinaryService.deleteImage(employeeIsExist.image);
      }
    }

    if (data.image === '') {
      if (employeeIsExist?.image) {
        await this.cloudinaryService.deleteImage(employeeIsExist.image);
      }

      image = undefined;
    }

    if (data.role === UserRole.CUSTOMER) {
      throw new BadRequestException('Invalid request Role User');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.users.update({
      where: { id },
      data: {
        email: data.email,
        password: data.password,
        role: data.role,
        isActive: data.isActive,
        storeId: data.storeId,
      },
    });

    const employee = await prisma.employee.update({
      where: { userId: user.id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        image: image,
        userId: user.id,
      },
    });

    const result = toEmployeeResponse(employee);
    return result;
  }

  async remove(id: bigint) {
    const employeeIsExist = await prisma.employee.findUnique({
      where: { userId: id },
    });

    if (employeeIsExist?.image) {
      await this.cloudinaryService.deleteImage(employeeIsExist.image);
    }

    const user = await prisma.users.delete({
      where: { id },
      omit: {
        password: true,
        refreshToken: true,
      },
      include: {
        employees: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    const result = toUsersEmployeeResponse(user);

    return result;
  }

  // ------------------------------- Customer ------------------------------------
  async findAllCustomer(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const data = await prisma.users.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        role: 'CUSTOMER',
        customer: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      omit: {
        password: true,
        refreshToken: true,
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    const total = await prisma.users.count({
      where: {
        role: 'CUSTOMER',
      },
    });

    const result = data.map(toUsersCustomersResponse);
    return {
      success: true,
      data: result,
      meta: {
        skip,
        limit,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }
}
