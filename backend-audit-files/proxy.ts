import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "hafiz_pos_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get(SESSION_COOKIE)?.value;

  const hasSession = Boolean(sessionCookie);

  // Dashboard ko bina session ke access nahi karne dena
  if (
    pathname.startsWith("/dashboard") &&
    !hasSession
  ) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  /*
   * IMPORTANT:
   * /login se /dashboard automatic redirect
   * abhi nahi karenge.
   *
   * Kyunke cookie exist kar sakti hai,
   * lekin expired / invalid bhi ho sakti hai.
   */

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
  ],
};