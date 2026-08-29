import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseId(value: string) {
  const id = Number(value);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

// ======================================================
// UPDATE USER
// ======================================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } =
      await context.params;

    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    const current =
      await db.orm.public.AppUser
        .where({
          id,
        })
        .first();

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

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

    if (
      !name ||
      !email ||
      !phone
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and phone are required.",
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

    if (
      duplicate &&
      duplicate.id !== id
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
      await db.orm.public.AppUser
        .where({
          id,
        })
        .update({
          name,
          email,
          phone,
          status:
            status === "Inactive"
              ? "Inactive"
              : "Active",
          roleId,
          branchId,
        });

    return NextResponse.json({
      success: true,
      message:
        "User updated successfully.",
      user,
    });
  } catch (error) {
    console.error(
      "PUT /api/users/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update user.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// DELETE USER
// ======================================================

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } =
      await context.params;

    const id = parseId(rawId);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user ID.",
        },
        {
          status: 400,
        }
      );
    }

    const user =
      await db.orm.public.AppUser
        .where({
          id,
        })
        .first();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    await db.orm.public.AppUser
      .where({
        id,
      })
      .delete();

    return NextResponse.json({
      success: true,
      message:
        "User deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/users/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete user.",
      },
      {
        status: 500,
      }
    );
  }
}