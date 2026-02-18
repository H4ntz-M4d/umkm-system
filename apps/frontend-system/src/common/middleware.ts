import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token");

  if (!refreshToken && request.nextUrl.pathname.startsWith("/management")) {
    return NextResponse.redirect(new URL("auth/internal", request.url));
  }

  return NextResponse.next();
}
