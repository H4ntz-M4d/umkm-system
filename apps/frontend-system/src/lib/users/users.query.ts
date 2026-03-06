import api from '../api.management'

export const fetchUsersEmployee = async (pageIndex = 0, pageSize = 10) => {
    const skip = pageIndex * pageSize
    const res = await api.get(`api/v1/users/employees?skip=${skip}&limit=${pageSize}`).json<any>()
    return res
}

export const fetchUsersCustomer = async (pageIndex = 0, pageSize = 10) => {
    const skip = pageIndex * pageSize
    const res = await api.get(`api/v1/users/customers?skip=${skip}&limit=${pageSize}`).json<any>()
    return res
}