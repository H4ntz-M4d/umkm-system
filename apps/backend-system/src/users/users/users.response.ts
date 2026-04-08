import { Prisma } from '@repo/db';

type UsersEmployeeEntity = Prisma.UsersGetPayload<{
  select: {
    id: true;
    storeId: true;
    email: true;
    employees: {
      select: {
        name: true;
        phone: true;
      };
    };
    role: true;
    isActive: true;
    createdAt: true;
    slug: true;
  };
}>;

export function toUsersEmployeeResponse(entity: UsersEmployeeEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    email: entity.email,
    name: entity.employees?.name,
    phone: entity.employees?.phone,
    role: entity.role,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    slug: entity.slug,
  };
}

type UsersCustomersEntity = Prisma.UsersGetPayload<{
  select: {
    id: true;
    storeId: true;
    email: true;
    customer: {
      select: {
        name: true;
        phone: true;
      };
    };
    role: true;
    isActive: true;
    createdAt: true;
    slug: true;
  };
}>;

export function toUsersCustomersResponse(entity: UsersCustomersEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    email: entity.email,
    name: entity.customer?.name,
    phone: entity.customer?.phone,
    role: entity.role,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    slug: entity.slug,
  };
}

type UsersWithEmployeeEntity = Prisma.UsersGetPayload<{
  select: {
    id: true;
    email: true;
    employees: {
      select: {
        name: true;
        address: true;
        phone: true;
        image: true;
      };
    };
    isActive: true;
    storeId: true;
    role: true;
  };
}>;

export function toUsersWithEmployeeResponse(entity: UsersWithEmployeeEntity) {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.employees?.name,
    address: entity.employees?.address,
    phone: entity.employees?.phone,
    image: entity.employees?.image,
    isActive: entity.isActive,
    storeId: entity.storeId,
    role: entity.role,
  };
}

type EmployeeEntity = Prisma.EmployeeGetPayload<{
  select: {
    id: true;
    name: true;
    address: true;
    phone: true;
    image: true;
    userId: true;
  };
}>;

export function toEmployeeResponse(entity: EmployeeEntity) {
  return {
    id: entity.id,
    name: entity.name,
    address: entity.address,
    phone: entity.phone,
    image: entity.image,
    userId: entity.userId,
  };
}
