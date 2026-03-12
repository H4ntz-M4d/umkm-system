import managementApi from '../api.management'

export const fetchStore = async (pageIndex = 0, pageSize = 10) => {
    const skip = pageIndex * pageSize
    const res = await managementApi.get(`api/v1/stores?skip=${skip}&limit=${pageSize}`).json<any>();
    const total = res.meta?.total ?? res.total ?? res.count ?? 0
    return { data: res.data, total }
}

export const fetchStoreList = async () => {
    const res = await managementApi.get(`api/v1/stores/list`).json<any>();
    return { data: res.data }
}

export const createStore = async (payload: any) => {
    const res = await managementApi.post('api/v1/stores', { json: payload }).json<any>();
    return res.data
}

export const updateStore = async (id: string, payload: any) => {
    const res = await managementApi.patch(`api/v1/stores/${id}`, { json: payload }).json<any>();
    return res.data
}

export const removeStore = async (id: string) => {
    const res = await managementApi.delete(`api/v1/stores/${id}`).json<any>();
    return res.data
}