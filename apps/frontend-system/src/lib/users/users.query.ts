import api from '../api.management'

export const fetchUsersEmployee = async (pageIndex = 0, pageSize = 10, search?: string) => {
    const skip = pageIndex * pageSize
    const res = await api.get(`api/v1/users/employees?skip=${skip}&limit=${pageSize}&search=${search}`).json<any>()
    return res
}

export const fetchUsersCustomer = async (pageIndex = 0, pageSize = 10) => {
    const skip = pageIndex * pageSize
    const res = await api.get(`api/v1/users/customers?skip=${skip}&limit=${pageSize}`).json<any>()
    return res
}

export const fetchUserById = async (userId: string) => {
    const res = await api.get(`api/v1/users/${userId}`).json<any>();
    return res
}

export const createStaff = async (formData: FormData) => {
    const res = await api.post(`api/v1/users/`, { body: formData }).json<any>()
    return res.data
}

export const updateStaff = async (formData: FormData, id: string) => {
    const res = await api.patch(`api/v1/users/${id}`, { body: formData }).json<any>()
    return res.data
}

export const removeStaff = async (userId: string) => {
    const res = await api.delete(`api/v1/users/${userId}`).json<any>()
    return res.data
}