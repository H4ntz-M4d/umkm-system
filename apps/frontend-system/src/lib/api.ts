import ky from 'ky';
import { useAuth } from './auth/useAuth';

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuth.getState().accessToken;

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      }
    ],
    afterResponse: [
      async (_req, _opt, res) => {
        if (res.status === 401 && !_req.url.includes("auth/admin/refresh")) {
          try {
            const refreshResponse = await ky.post(`${process.env.NEXT_PUBLIC_API_URL}auth/admin/refresh`, {
              credentials: "include"
            }).json<any>();

            const newAccessToken = refreshResponse.data.accessToken

            useAuth.getState().setToken(newAccessToken)

            _req.headers.set(
              "Authorization", `Bearer ${newAccessToken}`
            )

            return ky(_req);
          } catch (error) {
            useAuth.getState().logout()
            window.location.href = "/auth/internal"
          }
        }

        return res
        // if (!res.ok) {
        //   const body = await res.json();
        //   throw body;
        // }
      },
    ],
  },
});

export default api