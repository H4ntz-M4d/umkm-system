import ky from "ky";
import { useAuth } from "@/lib/queries/auth/useAuth";

export const managementApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include",
  hooks: {
    afterResponse: [
      async (_req, _opt, res) => {
        if (
          res.status === 401 &&
          !_req.url.includes("auth/management/ref")
        ) {
          try {
            await ky.post(
              `${process.env.NEXT_PUBLIC_API_URL}auth/management/ref`,
              {
                credentials: "include",
              },
            );

            return ky(_req);
          } catch (err) {
            if (typeof window !== "undefined") {
              window.location.href = "/auth/management";
            }
          }
        }

        return res;
      },
    ],
  },
});

export default managementApi;
