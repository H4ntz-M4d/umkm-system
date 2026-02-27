import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  if (pathname.startsWith("/management")) {
    const refreshToken = request.cookies.get("refresh_token_admin");
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/auth/management", request.url));
    }
  }

  if (pathname.startsWith("/wishlist") || pathname.startsWith("/cart")) {
    const refreshToken = request.cookies.get("refresh_token_customer");
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};