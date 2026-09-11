import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/prisma/db";
import { verifyPassword } from "@/src/lib/auth/password";
import { setSessionCookie } from "@/src/lib/auth/session";
import { isSuperAdminRole } from "@/src/lib/auth/constants";

export async function POST(request: NextRequest) {
  try {
    console.log("LOGIN 0 - request received");

    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       FIND USER
    ===================================================== */

    console.log("LOGIN 1 - finding user");

    const user =
      await db.orm.public.AppUser
        .where({
          email,
        })
        .first();

    console.log("LOGIN 2 - user lookup completed");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       STATUS CHECK
    ===================================================== */

    if (user.status !== "Active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       PASSWORD CHECK
    ===================================================== */

    console.log("LOGIN 3 - verifying password");

    const isPasswordValid =
      verifyPassword(
        password,
        user.passwordHash
      );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    console.log("LOGIN 4 - password verified");

    /* =====================================================
       LOAD ROLE
    ===================================================== */

    console.log("LOGIN 5 - loading role");

    const userRole =
      await db.orm.public.Role
        .where({
          id: user.roleId,
        })
        .first();

    console.log("LOGIN 6 - role loaded");

    if (!userRole) {
      return NextResponse.json(
        {
          success: false,
          message: "User role not found.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       LOAD PERMISSIONS
    ===================================================== */

    let permissions: string[] = [];

    if (isSuperAdminRole(userRole.name)) {
      permissions = ["*"];
    } else {
      console.log("LOGIN 7 - loading permissions");

      const allPermissions =
        await db.orm.public.RolePermission.all();

      permissions = allPermissions
        .filter(
          (permission) =>
            permission.roleId === user.roleId
        )
        .map(
          (permission) =>
            permission.permission
        );

      console.log("LOGIN 8 - permissions loaded");
    }

    /* =====================================================
       LAST LOGIN UPDATE
    ===================================================== */

    console.log("LOGIN 9 - updating last login");

    await db.orm.public.AppUser
      .where({
        id: user.id,
      })
      .update({
        lastLoginAt: new Date().toISOString(),
      });

    console.log("LOGIN 10 - last login updated");

    /* =====================================================
       CREATE SESSION COOKIE
    ===================================================== */

    console.log("LOGIN 11 - setting session cookie");

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole.name,
      roleId: user.roleId,
      branchId: user.branchId,
      permissions,
    });

    console.log("LOGIN 12 - session cookie set");

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole.name,
        roleId: user.roleId,
        branchId: user.branchId,
        permissions,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/auth/login ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Login failed.",
      },
      {
        status: 500,
      }
    );
  }
}