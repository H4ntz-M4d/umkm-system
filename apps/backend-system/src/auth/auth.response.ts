import { Prisma } from '@repo/db';

type UserEmployeeProfileEntity = Prisma.UsersGetPayload<{
  select: {
    id: true;
    email: true;
    role: true;
    isActive: true;
    storeId: true;
    employees: {
      select: {
        name: true;
      };
    };
  };
}>;

export function toEmployeeProfileResponse(entity: UserEmployeeProfileEntity) {
  return {
    id: entity.id,
    email: entity.email,
    role: entity.role,
    isActive: entity.isActive,
    storeId: entity.storeId,
    name: entity.employees?.name,
  };
}

type UserCustomerProfileEntity = Prisma.UsersGetPayload<{
  select: {
    id: true;
    email: true;
    role: true;
    isActive: true;
    customer: {
      select: {
        name: true;
      };
    };
  };
}>;

export function toCustomerProfileResponse(entity: UserCustomerProfileEntity) {
  return {
    id: entity.id,
    email: entity.email,
    role: entity.role,
    isActive: entity.isActive,
    name: entity.customer?.name,
  };
}
