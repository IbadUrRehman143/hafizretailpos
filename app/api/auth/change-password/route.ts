import { NextRequest, NextResponse } from "next/server";

import { currentSession } from "@/src/lib/auth/currentUser";
import {
  hashPassword,
  verifyPassword,
  validatePassword,
} from "@/src/lib/auth/password";
import { db } from "@/src/prisma/db";

export async function POST(req: NextRequest) {
  const session = await currentSession();

  if (!session) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  const body = await req.json();

  const user = await db.orm.public.AppUser.where({
    id: session.id,
  }).first();

  if (
    !user ||
    !verifyPassword(
      String(body.currentPassword || ""),
      user.passwordHash
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Current password is incorrect.",
      },
      { status: 400 }
    );
  }

  const newPassword = String(body.newPassword || "");

  // The legacy implementation enforced a minimum length by
  // throwing inside its own hashPassword(). The canonical
  // hashPassword() has no built-in check, so validate explicitly
  // here to preserve (and align with the rest of the app's)
  // password-strength enforcement rather than silently dropping it.
  const passwordError = validatePassword(newPassword);

  if (passwordError) {
    return NextResponse.json(
      { success: false, message: passwordError },
      { status: 400 }
    );
  }

  try {
    await db.orm.public.AppUser.where({
      id: session.id,
    }).update({
      passwordHash: hashPassword(newPassword),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        message:
          e instanceof Error
            ? e.message
            : "Password update failed.",
      },
      { status: 400 }
    );
  }
}
