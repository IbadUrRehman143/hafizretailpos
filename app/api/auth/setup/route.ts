import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/prisma/db";
import {
  hashPassword,
  validatePassword,
} from "@/src/lib/auth/password";
import { setSessionCookie } from "@/src/lib/auth/session";

export async function GET() {
  const users =
    await db.orm.public.AppUser.all();

  const setupRequired =
    users.length === 0 ||
    !users.some(
      (user) => Boolean(user.passwordHash)
    );

  return NextResponse.json({
    success: true,
    setupRequired,
  });
}

export async function POST(
  request: NextRequest
) {
  try {
    const users =
      await db.orm.public.AppUser.all();

    if (
      users.some(
        (user) => Boolean(user.passwordHash)
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Initial setup is already complete.",
        },
        {
          status: 403,
        }
      );
    }

    const body = await request.json();

    const name = String(
      body.name || "Super Admin"
    ).trim();

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password || ""
    );

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    const passwordError =
      validatePassword(password);

    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          message: passwordError,
        },
        {
          status: 400,
        }
      );
    }

    const roles =
      await db.orm.public.Role.all();

    let role = roles.find(
      (item) =>
        item.name === "SUPER_ADMIN"
    );

    if (!role) {
      role =
        await db.orm.public.Role.create({
          name: "SUPER_ADMIN",
          description:
            "Super Admin Access",
        });
    }

    const existingUser = users.find(
      (item) =>
        String(item.email)
          .trim()
          .toLowerCase() === email
    );

    let user;

    if (existingUser) {
      user =
        await db.orm.public.AppUser.where({
          id: existingUser.id,
        }).update({
          name,
          passwordHash:
            hashPassword(password),
          status: "Active",
          roleId: role.id,
        });

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to update Super Admin.",
          },
          {
            status: 500,
          }
        );
      }
    } else {
      user =
        await db.orm.public.AppUser.create({
          name,
          email,
          phone: "",
          passwordHash:
            hashPassword(password),
          status: "Active",
          roleId: role.id,
          branchId: null,
        });
    }

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: role.name,
      roleId: user.roleId,
      branchId: user.branchId,
      permissions: ["*"],
    });

    return NextResponse.json({
      success: true,
      message:
        "Super Admin setup complete.",
    });
  } catch (error) {
    console.error(
      "POST /api/auth/setup:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Setup failed.",
      },
      {
        status: 500,
      }
    );
  }
}