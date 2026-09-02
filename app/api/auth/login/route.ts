import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { verifyPassword } from "@/src/lib/auth/password";
import { setSessionCookie } from "@/src/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
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
        { status: 400 }
      );
    }

    // User find
    const users = await db.orm.public.AppUser.all();

    const user = users.find(
      (u) =>
        String(u.email).trim().toLowerCase() === email
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // User status check
    if (user.status !== "Active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active.",
        },
        { status: 403 }
      );
    }

    // Password verify
    const isPasswordValid = verifyPassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Role + permissions fetch
    const [roles, rolePermissions] = await Promise.all([
      db.orm.public.Role.all(),
      db.orm.public.RolePermission.all(),
    ]);

    const userRole = roles.find(
      (role) => role.id === user.roleId
    );

    const permissions =
      userRole?.name === "Super Admin"
        ? ["*"]
        : rolePermissions
            .filter(
              (permission) =>
                permission.roleId === user.roleId
            )
            .map(
              (permission) =>
                permission.permission
            );

    // Last login update
    await db.orm.public.AppUser.where({
      id: user.id,
    }).update({
      lastLoginAt: new Date().toISOString(),
    });

    // Complete session cookie
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole?.name || "USER",
      roleId: user.roleId,
      branchId: user.branchId,
      permissions,
    });

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole?.name || "USER",
        roleId: user.roleId,
        branchId: user.branchId,
        permissions,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/auth/login:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Login failed.",
      },
      { status: 500 }
    );
  }
}