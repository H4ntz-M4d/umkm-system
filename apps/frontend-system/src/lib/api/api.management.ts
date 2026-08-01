import ky from "ky";

const baseURL = typeof window === "undefined"
  ? process.env.SERVER_API_URL              // server → http://localhost:5000/api
  : `${process.env.NEXT_PUBLIC_API_URL}/`;

export const managementApi = ky.create({
  prefixUrl: baseURL,
  credentials: "include",
  // Lihat catatan di api.customer.ts: penanda sesi supaya backend tidak salah
  // memilih cookie ketika sesi admin dan customer sama-sama ada.
  headers: { "x-auth-scope": "admin" },
  hooks: {
    afterResponse: [
      async (_req, _opt, res) => {
        if (
          res.status === 401 &&
          !_req.url.includes("auth/management/ref")
        ) {
          try {
            await ky.post(
              `${baseURL}auth/management/ref`,
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
