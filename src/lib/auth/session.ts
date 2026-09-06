import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Fail fast at boot, not silently at runtime with a weak
  // fallback. Never log the secret's value here or anywhere else.
  throw new Error(
    "JWT_SECRET environment variable is required and must not be empty. " +
      "Set it in your environment (see .env.example)."
  );
}

export const SESSION_COOKIE = "hafiz_pos_session";

export interface SessionPayload {
  id: number;
  email: string;
  name: string;
  role: string;
  roleId: number | null;
  branchId: number | null;
  permissions: string[];
}

export function verifySessionToken(
  token: string
): SessionPayload | null {
  try {
    return jwt.verify(
      token,
      JWT_SECRET
    ) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(
  payload: SessionPayload
) {
  const cookieStore = await cookies();

  const token = jwt.sign(
    payload,
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  cookieStore.set(
    SESSION_COOKIE,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    }
  );
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(
      SESSION_COOKIE
    )?.value || "";

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.delete(
    SESSION_COOKIE
  );
}