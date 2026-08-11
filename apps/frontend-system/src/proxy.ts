import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessPath } from "@/lib/auth/route-access.config";
import { getRoleFromToken } from "@/lib/auth/token-role";

function isTokenExpired(token?: string) {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    const decodedJson = atob(payloadBase64); // atob aman digunakan di Next.js Middleware
    const payload = JSON.parse(decodedJson);
    // Tambahkan buffer 10 detik untuk menghindari tabrakan waktu (race condition)
    return Date.now() >= payload.exp * 1000 - 10000;
  } catch (e) {
    return true; // Jika gagal dibongkar, anggap saja kadaluarsa
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/management") ||
    pathname.startsWith("/point-of-sale")
  ) {
    const accessToken = request.cookies.get("access_token_admin")?.value;
    const refreshToken = request.cookies.get("refresh_token_admin")?.value;

    const role = getRoleFromToken(accessToken ?? refreshToken);

    /**
     * Tidak ada sesi, atau tokennya tidak bisa dibaca sama sekali. Keduanya
     * berarti sesi perlu dibangun ulang, jadi arahkan ke login — bukan ke 404,
     * yang akan menyesatkan karena masalahnya bukan soal hak akses.
     */
    if ((!accessToken && !refreshToken) || !role) {
      return NextResponse.redirect(new URL("/auth/management", request.url));
    }

    /**
     * Sesinya sah, tapi rolenya tidak berhak atas halaman ini. Diperiksa sebelum
     * penyegaran token karena hasilnya tidak akan berubah: role melekat pada
     * pengguna, bukan pada umur tokennya.
     */
    if (!canAccessPath(pathname, role)) {
      return NextResponse.rewrite(new URL("/access-denied", request.url));
    }

    if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
      try {
        const refreshRes = await fetch(
          `${process.env.SERVER_API_URL}auth/management/ref`,
          {
            method: "POST",
            headers: {
              Cookie: `refresh_token_admin=${refreshToken}`,
            },
          },
        );

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newAccessToken = data.accessToken;

          // CARA BENAR: Injeksi header ke dalam REQUEST yang akan menuju layout.tsx
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set("x-access-token-admin", newAccessToken);

          const response = NextResponse.next({
            request: { headers: requestHeaders },
          });

          // Forward cookie baru dari NestJS ke Browser pengguna
          const setCookieHeader = refreshRes.headers.getSetCookie();
          setCookieHeader.forEach((cookieString: string) => {
            response.headers.append("Set-Cookie", cookieString);
          });

          return response;
        }
      } catch (error) {
        return NextResponse.redirect(new URL("/auth/management", request.url));
      }
    }
  }

  // /cart sengaja TIDAK dijaga: keranjang guest hidup di localStorage, jadi
  // pengunjung harus bisa membukanya sebelum login.
  if (
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders")
  ) {
    const accessToken = request.cookies.get("access_token_customer")?.value;
    const refreshToken = request.cookies.get("refresh_token_customer")?.value;
    if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
      try {
        const refreshRes = await fetch(
          `${process.env.SERVER_API_URL}auth/c/ref`,
          {
            method: "POST",
            headers: {
              Cookie: `refresh_token_customer=${refreshToken}`,
            },
          },
        );

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newAccessToken = data.accessToken;

          // CARA BENAR: Injeksi header ke dalam REQUEST yang akan menuju layout.tsx
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set("x-access-token-customer", newAccessToken);

          const response = NextResponse.next({
            request: { headers: requestHeaders },
          });

          // Forward cookie baru dari NestJS ke Browser pengguna
          const setCookieHeader = refreshRes.headers.getSetCookie();
          setCookieHeader.forEach((cookieString: string) => {
            response.headers.append("Set-Cookie", cookieString);
          });

          return response;
        }
      } catch (error) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }

    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const customerAccessToken = request.cookies.get(
    "access_token_customer",
  )?.value;
  const customerRefreshToken = request.cookies.get(
    "refresh_token_customer",
  )?.value;

  if (
    (!customerAccessToken || isTokenExpired(customerAccessToken)) &&
    customerRefreshToken
  ) {
    try {
      const refreshRes = await fetch(
        `${process.env.SERVER_API_URL}auth/c/ref`,
        {
          method: "POST",
          headers: { Cookie: `refresh_token_customer=${customerRefreshToken}` },
        },
      );

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-access-token-customer", data.accessToken);

        const response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        refreshRes.headers.getSetCookie().forEach((cookie) => {
          response.headers.append("Set-Cookie", cookie);
        });
        return response;
      }
    } catch {
      // Gagal refresh, lanjut sebagai guest
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
