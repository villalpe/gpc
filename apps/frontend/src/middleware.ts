import { NextRequest, NextResponse } from "next/server";

const PRIVATE_PATHS = ["/dashboard", "/admin", "/inventory", "/audit", "/users"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPrivate = PRIVATE_PATHS.some((p) => pathname.startsWith(p));

  if (!isPrivate) return NextResponse.next();

  const access = req.cookies.get("access_token")?.value;
  const refresh = req.cookies.get("refresh_token")?.value;

  if (!access && !refresh) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/inventory/:path*", "/audit/:path*", "/users/:path*"],
};