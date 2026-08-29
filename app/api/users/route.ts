import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

// ======================================================
// GET USERS
// ======================================================

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

    const result =
      users.map((user) => {
        const role =
          roles.find(
            (item) =>
              item.id === user.roleId
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
            user.lastLoginAt
              ? user.lastLoginAt
              : "Never",
        };
      });

    return NextResponse.json({
      success: true,
      users: result,
    });
  } catch (error) {
    console.error(
      "GET /api/users error:",
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

// ======================================================
// CREATE USER
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

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

    const status =
      String(
        body.status || "Active"
      );

    const roleId =
      Number(body.roleId);

    const branchId =
      body.branchId
        ? Number(body.branchId)
        : null;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Phone is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(roleId) ||
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

    const duplicate =
      await db.orm.public.AppUser
        .where({
          email,
        })
        .first();

    if (duplicate) {
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

    if (branchId) {
      const branch =
        await db.orm.public.Branch
          .where({
            id: branchId,
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

    const user =
      await db.orm.public.AppUser.create({
        name,
        email,
        phone,
        passwordHash: "",
        status:
          status === "Inactive"
            ? "Inactive"
            : "Active",
        roleId,
        branchId,
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "User created successfully.",
        user,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/users error:",
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