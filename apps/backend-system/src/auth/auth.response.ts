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
    store: {
      select: {
        name: true;
        isProductionHouse: true;
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
    storeName: entity.store?.name,
    /**
     * Apakah pengguna ini orang pusat.
     *
     * Dihitung di server dengan aturan yang sama persis dengan
     * `CentralStoreGuard`: tanpa toko berarti pengelola pusat, dan toko
     * berpenanda rumah produksi adalah pusatnya. Dikirim ke layar supaya
     * tombol tambah/ubah/hapus tidak ditampilkan pada orang yang ujungnya
     * akan ditolak server — bukan sebagai pengganti penjagaan itu sendiri.
     */
    isCentralStore:
      entity.storeId === null || Boolean(entity.store?.isProductionHouse),
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
        image: true;
        phone: true;
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
    image: entity.customer?.image,
    phone: entity.customer?.phone,
  };
}
