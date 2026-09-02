import { NextResponse } from "next/server";

import { db } from "@/src/prisma/db";
import { getSession } from "@/src/lib/auth/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 401,
      }
    );
  }

  const user = await db.orm.public.AppUser.where({
    id: session.id,
  }).first();

  if (!user || user.status !== "Active") {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 401,
      }
    );
  }

  const roles = await db.orm.public.Role.all();
  const rolePermissions =
    await db.orm.public.RolePermission.all();

  const role = roles.find(
    (item) => item.id === user.roleId
  );

  const permissions =
    role?.name === "SUPER_ADMIN"
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

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: role?.name || "",
      roleId: user.roleId,
      branchId: user.branchId,
      permissions,
    },
  });
}