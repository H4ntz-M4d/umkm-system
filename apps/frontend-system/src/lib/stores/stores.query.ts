import api from '../api'
import { StoreResponse } from '@repo/schemas'

export const fetchStore = async (): Promise<StoreResponse[]> => {
    const res = await api.get('stores').json<any>();
    return res.data
}

export const createStore = async (payload: any) => {
    const res = await api.post('stores', {json: payload}).json<any>();
    return res.data
}