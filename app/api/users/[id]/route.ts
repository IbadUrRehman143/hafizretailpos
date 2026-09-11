import { NextRequest, NextResponse } from "next/server";

import { db } from "@/src/prisma/db";
import {
  hashPassword,
  validatePassword,
} from "@/src/lib/auth/password";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseId(value: string) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

/* =========================================================
   UPDATE USER
========================================================= */

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
          message: "Invalid user ID.",
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
          message: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

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
       BASIC VALIDATION
    ===================================================== */

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
            "Select a valid role.",
        },
        {
          status: 400,
        }
      );
    }

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
            "Select a valid branch.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       OPTIONAL NEW PASSWORD

       Blank password:
       Existing password stays unchanged.

       Password provided:
       Validate + hash + update.
    ===================================================== */

    if (password) {
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

    /* =====================================================
       UPDATE USER
    ===================================================== */

    const user =
      await db.transaction(
        async (
          tx
        ) => {
          const updateData = {
            name,
            email,
            phone,
            status,
            roleId,
            branchId,

            ...(password
              ? {
                  passwordHash:
                    hashPassword(
                      password
                    ),
                }
              : {}),
          };

          const updated =
            await tx.orm.public.AppUser
              .where({
                id,
              })
              .update(
                updateData
              );

          if (!updated) {
            throw new Error(
              "USER_UPDATE_FAILED"
            );
          }

          await tx.orm.public.AuditLog.create({
            module:
              "User",

            action:
              password
                ? "UPDATE_PASSWORD"
                : "UPDATE",

            description:
              password
                ? `User ${name} updated and password changed.`
                : `User ${name} updated.`,

            status:
              "Success",

            userName:
              name,

            userRole:
              role.name,
          });

          return updated;
        }
      );

    return NextResponse.json({
      success: true,

      message:
        password
          ? "User and password updated successfully."
          : "User updated successfully.",

      user: {
        ...user,
        passwordHash:
          undefined,
      },
    });
  } catch (error) {
    console.error(
      "PUT /api/users/[id]:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "USER_UPDATE_FAILED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User could not be updated.",
        },
        {
          status: 500,
        }
      );
    }

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

/* =========================================================
   DELETE USER
========================================================= */

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: rawId } =
      await context.params;

    const id =
      parseId(
        rawId
      );

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

    await db.transaction(
      async (
        tx
      ) => {
        await tx.orm.public.AppUser
          .where({
            id,
          })
          .delete();

        await tx.orm.public.AuditLog.create({
          module:
            "User",

          action:
            "DELETE",

          description:
            `User ${user.name} deleted.`,

          status:
            "Success",

          userName:
            user.name,
        });
      }
    );

    return NextResponse.json({
      success: true,
      message:
        "User deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/users/[id]:",
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