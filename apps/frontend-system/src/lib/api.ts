import ky from 'ky';

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: 'include',
  hooks: {
    afterResponse: [
      async (_req, _opt, res) => {
        if (!res.ok) {
          const body = await res.json();
          throw body;
        }
      },
    ],
  },
});

export default api