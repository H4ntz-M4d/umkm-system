import api from "../api"

export const loginAdmin = async (email: string, password: string) => {
    const response = await api.post("auth/management/login", {
        json: {email, password}
    }).json<any>();

    return response.data.accessToken
}

export const getProfile = async () => {
    const response = await api.get("auth/management/me").json<any>();
    return response
}
