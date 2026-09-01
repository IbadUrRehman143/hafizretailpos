import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import {
  normalizePermissions,
} from "@/src/lib/permissions";

const DEFAULT_ROLES = [
  {
    name: "Admin",
    description: "Full system access",
    permissions: [
      "dashboard","pos","products","inventory","purchases",
      "sales","returns","customers","suppliers","expenses",
      "reports","notifications","users","branches","settings",
      "auditLogs",
    ],
  },
  {
    name: "Manager",
    description: "Management access",
    permissions: [
      "dashboard","pos","products","inventory","purchases",
      "sales","returns","customers","suppliers","expenses",
      "reports","notifications",
    ],
  },
  {
    name: "Cashier",
    description: "POS and sales access",
    permissions: [
      "dashboard","pos","sales","returns",
      "customers","notifications",
    ],
  },
  {
    name: "Salesman",
    description: "Sales access",
    permissions: [
      "dashboard","pos","sales","customers",
    ],
  },
  {
    name: "Store Keeper",
    description: "Stock and purchase access",
    permissions: [
      "dashboard","products","inventory",
      "purchases","suppliers",
    ],
  },
] as const;

async function ensureDefaultRoles() {
  const current =
    await db.orm.public.Role.all();

  if (current.length > 0) return;

  await db.transaction(async (tx) => {
    for (const roleData of DEFAULT_ROLES) {
      const role =
        await tx.orm.public.Role.create({
          name: roleData.name,
          description: roleData.description,
        });

      for (const permission of roleData.permissions) {
        await tx.orm.public.RolePermission.create({
          roleId: role.id,
          permission,
        });
      }
    }
  });
}

export async function GET() {
  try {
    await ensureDefaultRoles();

    const [roles, permissions, users] =
      await Promise.all([
        db.orm.public.Role.all(),
        db.orm.public.RolePermission.all(),
        db.orm.public.AppUser.all(),
      ]);

    return NextResponse.json({
      success: true,
      roles: roles
        .map((role) => ({
          ...role,
          permissions: permissions
            .filter((p) => p.roleId === role.id)
            .map((p) => p.permission),
          totalUsers: users.filter(
            (user) => user.roleId === role.id
          ).length,
        }))
        .sort((a, b) => a.id - b.id),
    });
  } catch (error) {
    console.error("GET /api/roles:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load roles.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
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

    const roles =
      await db.orm.public.Role.all();

    const duplicate =
      roles.find(
        (role) =>
          role.name.trim().toLowerCase() ===
          name.toLowerCase()
      );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Role already exists.",
        },
        { status: 409 }
      );
    }

    const result =
      await db.transaction(async (tx) => {
        const role =
          await tx.orm.public.Role.create({
            name,
            description,
          });

        for (const permission of permissions) {
          await tx.orm.public.RolePermission.create({
            roleId: role.id,
            permission,
          });
        }

        await tx.orm.public.AuditLog.create({
          module: "User",
          action: "CREATE_ROLE",
          description: `Role ${name} created.`,
          status: "Success",
        });

        return {
          ...role,
          permissions,
          totalUsers: 0,
        };
      });

    return NextResponse.json(
      {
        success: true,
        role: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/roles:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create role.",
      },
      { status: 500 }
    );
  }
}
