import { NextRequest, NextResponse } from "next/server";

// Defined locally (not imported from @/lib/session) so this file does not pull
// in server-only modules like next/headers. Keep in sync with SESSION_COOKIE.
const SESSION_COOKIE = "session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.get(SESSION_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
