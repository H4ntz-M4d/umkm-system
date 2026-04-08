import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
  
  if (pathname.startsWith("/management")) {
    const accessToken = request.cookies.get("access_token_admin")?.value;
    const refreshToken = request.cookies.get("refresh_token_admin")?.value;
    if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
      try {
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}auth/management/ref`,
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

    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL("/auth/management", request.url));
    }
  }

  if (pathname.startsWith("/wishlist") || pathname.startsWith("/cart")) {
    const accessToken = request.cookies.get("access_token_customer")?.value;
    const refreshToken = request.cookies.get("refresh_token_customer")?.value;
    if ((!accessToken || isTokenExpired(accessToken)) && refreshToken) {
      try {
        const refreshRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}auth/c/ref`,
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};