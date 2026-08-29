import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  },
  /**
   * Seluruh panggilan API browser dilewatkan ke sini, bukan langsung ke
   * backend. Itu yang membuat cookie sesi tetap same-origin sehingga tidak
   * perlu SameSite=None, dan CORS browser tidak pernah terlibat.
   *
   * Alamat tujuannya WAJIB dari env: nilai `localhost` yang tertanam akan
   * menunjuk ke container frontend itu sendiri saat di-deploy, dan seluruh
   * API mati tanpa pesan yang jelas.
   */
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:6500';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  }
};

export default nextConfig;
