import api from "../api"

export const loginAdmin = async (email: string, password: string) => {
    const response = await api.post("auth/admin/login", {
        json: {email, password}
    }).json<any>();

    return response.data.accessToken
}

export const getProfile = async () => {
    const response = await api.get("auth/admin/me").json<any>();
    return response
}
