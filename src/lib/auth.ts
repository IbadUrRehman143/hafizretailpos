export type AuthSession = {
  userId: number;
  name: string;
  email: string;
  role: string;
  branchId: number | null;
  permissions: string[];
  exp: number;
};

export const AUTH_COOKIE = "hafiz_pos_session";

function b64url(input: Uint8Array | string) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromB64url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}
async function signature(data: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data))));
}
export async function createSessionToken(session: Omit<AuthSession, "exp">, ttlSeconds = 60 * 60 * 12) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters.");
  const payload = b64url(JSON.stringify({ ...session, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  return `${payload}.${await signature(payload, secret)}`;
}
export async function verifySessionToken(token?: string | null): Promise<AuthSession | null> {
  try {
    if (!token) return null;
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig || (await signature(payload, secret)) !== sig) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as AuthSession;
    if (!data.userId || !data.exp || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch { return null; }
}
export function hasPermission(session: AuthSession, module: string, action = "view") {
  if (session.role.toLowerCase() === "super admin") return true;
  const p = new Set(session.permissions);
  return p.has(module) || p.has(`${module}.${action}`);
}
