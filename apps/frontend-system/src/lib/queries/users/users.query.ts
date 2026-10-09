import managementApi from "../../api/api.management";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  AllUsersDataResponse,
  EmployeeOptionListResponse,
  SingleEmployeeDataResponse,
  SingleUsersDataResponse,
  SingleUsersWithEmployeeDataResponse,
} from "@repo/schemas";

export const fetchUsersEmployee = async (
  pageIndex = 0,
  pageSize = 10,
  search?: string,
) => {
  const skip = pageIndex * pageSize;
  const res = await apiFetcher(
    managementApi.get(
      `v1/users/employees?skip=${skip}&limit=${pageSize}&search=${search}`,
    ),
    AllUsersDataResponse,
  );
  return { data: res?.data, total: res?.meta?.total };
};

export const fetchUsersCustomer = async (
  pageIndex = 0,
  pageSize = 10,
  search?: string,
) => {
  const skip = pageIndex * pageSize;
  const res = await apiFetcher(
    managementApi.get(
      `v1/users/customers?skip=${skip}&limit=${pageSize}&search=${search}`,
    ),
    AllUsersDataResponse,
  );
  return { data: res?.data, total: res?.meta?.total };
};

/// Daftar nama karyawan untuk dropdown "Diproses oleh". Ringkas dan tanpa
/// paginasi, serta boleh diakses Kasir — beda dengan `fetchUsersEmployee`
/// yang melayani tabel manajemen karyawan.
export const fetchEmployeeOptions = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/users/employees/list"),
    EmployeeOptionListResponse,
  );

  return res.data;
};

export const fetchUserById = async (userId: string) => {
  const res = await apiFetcher(
    managementApi.get(`v1/users/${userId}`),
    SingleUsersWithEmployeeDataResponse,
  );
  return res;
};

export const createStaff = async (formData: FormData) => {
  const res = await apiFetcher(
    managementApi.post(`v1/users/`, { body: formData }),
    SingleEmployeeDataResponse,
  );
  return res;
};

export const updateStaff = async (formData: FormData, id: string) => {
  const res = await apiFetcher(
    managementApi.patch(`v1/users/${id}`, { body: formData }),
    SingleEmployeeDataResponse,
  );
  return res;
};

export const removeStaff = async (userId: string) => {
  const res = await apiFetcher(
    managementApi.delete(`v1/users/${userId}`),
    SingleUsersDataResponse,
  );
  return res;
};
