import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SESSION_COOKIE = "hafiz_pos_session";
const PUBLIC_API = ["/api/auth/login", "/api/auth/setup", "/api/auth/logout"];

function hasValidSession(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value || "";
  const authenticated = hasValidSession(token);

  if (pathname.startsWith("/dashboard") && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    pathname.startsWith("/api/") &&
    !PUBLIC_API.some((prefix) => pathname.startsWith(prefix)) &&
    !authenticated
  ) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
