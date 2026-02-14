import api from '../api'
import { StoreResponse } from '@repo/schemas'

export const fetchStore = async (pageIndex = 0, pageSize = 10) => {
    const skip = pageIndex * pageSize
    const res = await api.get(`stores?skip=${skip}&limit=${pageSize}`).json<any>();
    const total = res.meta?.total ?? res.total ?? res.count ?? 0
    return {data: res.data, total}
}

export const createStore = async (payload: any) => {
    const res = await api.post('stores', {json: payload}).json<any>();
    return res.data
}

export const updateStore = async (id: string, payload: any) => {
    const res = await api.patch(`stores/${id}`, {json: payload}).json<any>();
    return res.data
}

export const removeStore = async (id: string) => {
    const res = await api.delete(`stores/${id}`).json<any>();
    return res.data
}