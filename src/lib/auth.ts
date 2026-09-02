import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";
import { db } from "@/src/prisma/db";

export const AUTH_COOKIE = "hafiz_session";

const SESSION_SECONDS = 60 * 60 * 12;

// ======================================================
// Session Types
// ======================================================

export type SessionPayload = {
  id: number;
  email: string;
  name: string;
  role: string;
  roleId: number | null;
  branchId: number | null;
  permissions: string[];
  exp: number;
};

export type SessionData = Omit<SessionPayload, "exp">;

// ======================================================
// Helpers
// ======================================================

const b64u = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url");

function secret() {
  const value = process.env.AUTH_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "AUTH_SECRET must be at least 32 characters."
    );
  }

  return value;
}

// ======================================================
// Password
// ======================================================

export function hashPassword(password: string) {
  if (password.length < 8) {
    throw new Error(
      "Password must be at least 8 characters."
    );
  }

  const salt = randomBytes(16);

  const hash = scryptSync(
    password,
    salt,
    64
  );

  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(
  password: string,
  stored: string
) {
  try {
    const [algorithm, saltHex, hashHex] =
      stored.split("$");

    if (algorithm !== "scrypt") {
      return false;
    }

    if (!saltHex || !hashHex) {
      return false;
    }

    const expected = Buffer.from(
      hashHex,
      "hex"
    );

    const actual = scryptSync(
      password,
      Buffer.from(saltHex, "hex"),
      expected.length
    );

    return timingSafeEqual(
      expected,
      actual
    );
  } catch {
    return false;
  }
}

// ======================================================
// Session Token
// ======================================================

export function signSession(
  payload: SessionData
) {
  const body = b64u(
    JSON.stringify({
      ...payload,
      exp:
        Math.floor(Date.now() / 1000) +
        SESSION_SECONDS,
    })
  );

  const signature = createHmac(
    "sha256",
    secret()
  )
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function verifySessionToken(
  token: string
): SessionPayload | null {
  try {
    const [body, signature] =
      token.split(".");

    if (!body || !signature) {
      return null;
    }

    const expected = createHmac(
      "sha256",
      secret()
    )
      .update(body)
      .digest();

    const received = Buffer.from(
      signature,
      "base64url"
    );

    if (
      received.length !==
      expected.length
    ) {
      return null;
    }

    if (
      !timingSafeEqual(
        received,
        expected
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(
        body,
        "base64url"
      ).toString()
    ) as SessionPayload;

    if (
      payload.exp <=
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ======================================================
// Cookie
// ======================================================

export async function setSessionCookie(
  payload: SessionData
) {
  const cookieStore =
    await cookies();

  cookieStore.set(
    AUTH_COOKIE,
    signSession(payload),
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_SECONDS,
    }
  );
}

export async function clearSessionCookie() {
  const cookieStore =
    await cookies();

  cookieStore.set(
    AUTH_COOKIE,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );
}

// ======================================================
// Current Session
// ======================================================

export async function currentSession() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      AUTH_COOKIE
    )?.value || "";

  return verifySessionToken(token);
}

// ======================================================
// Build User Session
// ======================================================

export async function buildUserSession(user: {
  id: number;
  email: string;
  name: string;
  roleId: number | null;
  branchId: number | null;
}): Promise<SessionData> {
  const [roles, permissions] =
    await Promise.all([
      db.orm.public.Role.all(),
      db.orm.public.RolePermission.all(),
    ]);

  const role = roles.find(
    (item) =>
      item.id === user.roleId
  );

  const userPermissions =
    role?.name === "Super Admin"
      ? ["*"]
      : permissions
          .filter(
            (permission) =>
              permission.roleId ===
              user.roleId
          )
          .map(
            (permission) =>
              permission.permission
          );

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: role?.name || "USER",
    roleId: user.roleId,
    branchId: user.branchId,
    permissions: userPermissions,
  };
}

// ======================================================
// Permission Check
// ======================================================

export function hasPermission(
  session: SessionPayload,
  module: string,
  action = "view"
) {
  if (
    session.role === "Super Admin" ||
    session.permissions.includes("*")
  ) {
    return true;
  }

  return (
    session.permissions.includes(
      `${module}.${action}`
    ) ||
    session.permissions.includes(
      module
    )
  );
}