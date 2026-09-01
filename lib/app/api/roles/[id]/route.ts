import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import {
  normalizePermissions,
} from "@/src/lib/permissions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

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
          message: "Invalid role ID.",
        },
        { status: 400 }
      );
    }

    const current =
      await db.orm.public.Role
        .where({ id })
        .first();

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message: "Role not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const name =
      String(body.name || "").trim();

    const description =
      String(body.description || "").trim();

    const permissions =
      normalizePermissions(body.permissions);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Role name is required.",
        },
        { status: 400 }
      );
    }

    const allRoles =
      await db.orm.public.Role.all();

    const duplicate =
      allRoles.find(
        (role) =>
          role.id !== id &&
          role.name.trim().toLowerCase() ===
            name.toLowerCase()
      );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Role name already exists.",
        },
        { status: 409 }
      );
    }

    const result =
      await db.transaction(async (tx) => {
        const oldPermissions =
          await tx.orm.public.RolePermission
            .where({ roleId: id })
            .all();

        for (const permission of oldPermissions) {
          await tx.orm.public.RolePermission
            .where({ id: permission.id })
            .delete();
        }

        const updated =
          await tx.orm.public.Role
            .where({ id })
            .update({
              name,
              description,
            });

        for (const permission of permissions) {
          await tx.orm.public.RolePermission.create({
            roleId: id,
            permission,
          });
        }

        await tx.orm.public.AuditLog.create({
          module: "User",
          action: "UPDATE_ROLE",
          description: `Role ${name} updated.`,
          status: "Success",
        });

        return {
          ...updated,
          permissions,
        };
      });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully.",
      role: result,
    });
  } catch (error) {
    console.error(
      "PUT /api/roles/[id]:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update role.",
      },
      { status: 500 }
    );
  }
}

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
          message: "Invalid role ID.",
        },
        { status: 400 }
      );
    }

    const role =
      await db.orm.public.Role
        .where({ id })
        .first();

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message: "Role not found.",
        },
        { status: 404 }
      );
    }

    if (
      role.name.trim().toLowerCase() === "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Default Admin role cannot be deleted.",
        },
        { status: 409 }
      );
    }

    const users =
      await db.orm.public.AppUser
        .where({ roleId: id })
        .all();

    if (users.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete role because users are assigned to it.",
        },
        { status: 409 }
      );
    }

    await db.transaction(async (tx) => {
      const permissions =
        await tx.orm.public.RolePermission
          .where({ roleId: id })
          .all();

      for (const permission of permissions) {
        await tx.orm.public.RolePermission
          .where({ id: permission.id })
          .delete();
      }

      await tx.orm.public.Role
        .where({ id })
        .delete();

      await tx.orm.public.AuditLog.create({
        module: "User",
        action: "DELETE_ROLE",
        description: `Role ${role.name} deleted.`,
        status: "Success",
      });
    });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/roles/[id]:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete role.",
      },
      { status: 500 }
    );
  }
}
