import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string) {
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string) {
  try {
    const [scheme, salt, expectedHex] = String(stored || "").split("$");
    if (scheme !== "scrypt" || !salt || !expectedHex) return false;
    const actual = scryptSync(password, salt, KEYLEN);
    const expected = Buffer.from(expectedHex, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
