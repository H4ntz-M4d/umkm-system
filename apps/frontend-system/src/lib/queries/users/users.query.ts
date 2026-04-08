import managementApi from '../../api/api.management'
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  AllUsersDataResponse,
  SingleEmployeeDataResponse,
  SingleUsersDataResponse,
  SingleUsersWithEmployeeDataResponse,
} from "@repo/schemas";

export const fetchUsersEmployee = async (pageIndex = 0, pageSize = 10, search?: string) => {
    const skip = pageIndex * pageSize
    const res = await apiFetcher(
      managementApi.get(
        `api/v1/users/employees?skip=${skip}&limit=${pageSize}&search=${search}`,
      ),
      AllUsersDataResponse
    );
    return {data: res?.data, total: res?.meta?.total}
}

export const fetchUsersCustomer = async (pageIndex = 0, pageSize = 10, search?: string) => {
    const skip = pageIndex * pageSize
    const res = await apiFetcher(
      managementApi.get(
        `api/v1/users/customers?skip=${skip}&limit=${pageSize}&search=${search}`,
      ),
      AllUsersDataResponse,
    );
    return {data: res?.data, total: res?.meta?.total}
}

export const fetchUserById = async (userId: string) => {
    const res = await apiFetcher(
      managementApi.get(`api/v1/users/${userId}`),
      SingleUsersWithEmployeeDataResponse,
    );
    return res
}

export const createStaff = async (formData: FormData) => {
    const res = await apiFetcher(
      managementApi.post(`api/v1/users/`, { body: formData }),
      SingleEmployeeDataResponse
    );
    return res
}

export const updateStaff = async (formData: FormData, id: string) => {
    const res = await apiFetcher(
      managementApi.patch(`api/v1/users/${id}`, { body: formData }),
      SingleEmployeeDataResponse
    )
    return res
}

export const removeStaff = async (userId: string) => {
    const res = await apiFetcher(
        managementApi.delete(`api/v1/users/${userId}`),
        SingleUsersDataResponse
    )
    return res
}