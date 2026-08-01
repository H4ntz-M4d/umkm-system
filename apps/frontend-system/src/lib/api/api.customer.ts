import ky from "ky";

const baseURL =
  typeof window === "undefined"
    ? process.env.SERVER_API_URL // server → http://localhost:5000/api
    : `${process.env.NEXT_PUBLIC_API_URL}/`;

export const customerApi = ky.create({
  prefixUrl: baseURL,
  credentials: "include",
  // Satu browser bisa memegang sesi admin dan customer sekaligus. Tanpa penanda
  // ini backend memilih cookie admin lebih dulu, sehingga request customer ikut
  // gagal begitu sesi admin kedaluwarsa.
  headers: { "x-auth-scope": "customer" },
  hooks: {
    afterResponse: [
      async (_req, _opt, res) => {
        if (res.status === 401 && !_req.url.includes("auth/c/ref")) {
          try {
            await ky.post(`${baseURL}auth/c/ref`, {
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
