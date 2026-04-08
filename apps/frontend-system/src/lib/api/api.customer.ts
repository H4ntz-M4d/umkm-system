import ky from 'ky';
import { useCustomerAuth } from '@/lib/queries/auth/userCustomerAuth';

export const customerApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    afterResponse: [
      async (_req, _opt, res) => {
        if (res.status === 401) {
          try {
            await ky.post(
              `${process.env.NEXT_PUBLIC_API_URL}auth/c/ref`,
              {
                credentials: "include",
              },
            );

            return ky(_req);
          } catch (err) {
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
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