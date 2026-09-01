import { NextRequest, NextResponse } from "next/server";
const SESSION_COOKIE = "hafiz_pos_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (pathname.startsWith("/dashboard") && !hasSession) return NextResponse.redirect(new URL("/login", request.url));
  if (pathname === "/login" && hasSession) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}
export const config = { matcher:["/dashboard/:path*","/login"] };
