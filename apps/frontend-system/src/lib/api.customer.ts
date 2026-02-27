import ky from 'ky';
import { useCustomerAuth } from './auth/userCustomerAuth';

export const customerApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useCustomerAuth.getState().accessToken;
        console.log("Ini token harus masuk ke header:", token);

        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      }
    ],
    afterResponse: [
      async (_req, _opt, res) => {
        if (res.status === 401 && !_req.url.includes("auth/c/ref")) {
          try {
            const refreshResponse = await ky.post(`${process.env.NEXT_PUBLIC_API_URL}auth/c/ref`, {
              credentials: "include"
            }).json<any>();

            const newAccessToken = refreshResponse.data.accessToken

            useCustomerAuth.getState().setToken(newAccessToken)

            _req.headers.set(
              "Authorization", `Bearer ${newAccessToken}`
            )

            return ky(_req);
          } catch (error) {
            useCustomerAuth.getState().logout()
            localStorage.removeItem('is_customer_logged_in')
            throw error
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

export default customerApi