import ky from "ky";
import { useCustomerAuth } from "@/lib/queries/auth/userCustomerAuth";

const baseURL =
  typeof window === "undefined"
    ? process.env.SERVER_API_URL // server → http://localhost:5000/api
    : `${process.env.NEXT_PUBLIC_API_URL}/`;

export const customerApi = ky.create({
  prefixUrl: baseURL,
  credentials: "include",
  hooks: {
    afterResponse: [
      async (_req, _opt, res) => {
        if (res.status === 401 && !_req.url.includes("auth/c/ref")) {
          try {
            await ky.post(`${process.env.NEXT_PUBLIC_API_URL}auth/c/ref`, {
              credentials: "include",
            });

            return ky(_req);
          } catch (err) {
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          }
        }

        return res;
        // if (!res.ok) {
        //   const body = await res.json();
        //   throw body;
        // }
      },
    ],
  },
});

export default customerApi;
