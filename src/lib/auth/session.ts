import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "hafiz_pos_session";
const MAX_AGE = 60 * 60 * 12;

type SessionPayload = { userId: number; exp: number };

function secret() {
  const value = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production.");
  return "hafiz-retail-pos-dev-secret-change-before-production";
}
function b64(value: string) { return Buffer.from(value).toString("base64url"); }
function sign(data: string) { return createHmac("sha256", secret()).update(data).digest("base64url"); }

export function createSessionToken(userId: number) {
  const payload: SessionPayload = { userId, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}
export function verifySessionToken(token?: string | null): SessionPayload | null {
  try {
    if (!token) return null;
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;
    const expected = Buffer.from(sign(body));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!Number.isInteger(payload.userId) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}
export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
export async function setSessionCookie(userId: number) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
}
export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}
