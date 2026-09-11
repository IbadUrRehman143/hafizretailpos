import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/prisma/db";
import {
  hashPassword,
  validatePassword,
} from "@/src/lib/auth/password";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

/* =========================================================
   GET USERS
========================================================= */

export async function GET() {
  try {
    const [
      users,
      roles,
      branches,
      permissions,
    ] = await Promise.all([
      db.orm.public.AppUser.all(),
      db.orm.public.Role.all(),
      db.orm.public.Branch.all(),
      db.orm.public.RolePermission.all(),
    ]);

    const result = users
      .map((user) => {
        const role = roles.find(
          (item) =>
            item.id ===
            user.roleId
        );

        const branch =
          branches.find(
            (item) =>
              item.id ===
              user.branchId
          );

        const userPermissions =
          role
            ? permissions
                .filter(
                  (permission) =>
                    permission.roleId ===
                    role.id
                )
                .map(
                  (permission) =>
                    permission.permission
                )
            : [];

        return {
          ...user,

          passwordHash:
            undefined,

          role:
            role?.name || "",

          roleId:
            role?.id || null,

          branch:
            branch?.name || "",

          branchId:
            branch?.id || null,

          permissions:
            userPermissions,

          lastLogin:
            user.lastLoginAt ||
            "Never",
        };
      })
      .sort(
        (a, b) =>
          a.id - b.id
      );

    return NextResponse.json({
      success: true,
      users: result,
    });
  } catch (error) {
    console.error(
      "GET /api/users:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load users.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   CREATE USER
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const password =
      String(
        body.password || ""
      );

    const status =
      String(
        body.status || "Active"
      ) === "Inactive"
        ? "Inactive"
        : "Active";

    const roleId =
      Number(
        body.roleId
      );

    const branchId =
      body.branchId
        ? Number(
            body.branchId
          )
        : null;

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !name ||
      !email ||
      !phone ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email, phone and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    if (
      !validEmail(
        email
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    const passwordError =
      validatePassword(
        password
      );

    if (
      passwordError
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            passwordError,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ROLE VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(
        roleId
      ) ||
      roleId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid role.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       BRANCH VALIDATION
    ===================================================== */

    if (
      branchId !== null &&
      (
        !Number.isInteger(
          branchId
        ) ||
        branchId <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid branch.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       DUPLICATE EMAIL
    ===================================================== */

    const duplicate =
      await db.orm.public.AppUser
        .where({
          email,
        })
        .first();

    if (
      duplicate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       ROLE
    ===================================================== */

    const role =
      await db.orm.public.Role
        .where({
          id: roleId,
        })
        .first();

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Selected role not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       BRANCH
    ===================================================== */

    if (
      branchId
    ) {
      const branch =
        await db.orm.public.Branch
          .where({
            id:
              branchId,
          })
          .first();

      if (!branch) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Selected branch not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /* =====================================================
       CREATE USER
    ===================================================== */

    const user =
      await db.transaction(
        async (
          tx
        ) => {
          const created =
            await tx.orm.public.AppUser.create({
              name,

              email,

              phone,

              passwordHash:
                hashPassword(
                  password
                ),

              status,

              roleId,

              branchId,
            });

          await tx.orm.public.AuditLog.create({
            module:
              "User",

            action:
              "CREATE",

            description:
              `User ${name} created with role ${role.name}.`,

            status:
              "Success",

            userName:
              name,

            userRole:
              role.name,
          });

          return created;
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "User created successfully.",

        user: {
          ...user,

          passwordHash:
            undefined,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/users:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create user.",
      },
      {
        status: 500,
      }
    );
  }
}