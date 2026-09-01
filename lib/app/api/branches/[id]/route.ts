import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

export async function GET(
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
          message: "Invalid branch ID.",
        },
        { status: 400 }
      );
    }

    const branch =
      await db.orm.public.Branch
        .where({ id })
        .first();

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch not found.",
        },
        { status: 404 }
      );
    }

    const users =
      await db.orm.public.AppUser
        .where({ branchId: id })
        .all();

    return NextResponse.json({
      success: true,
      branch: {
        ...branch,
        totalUsers: users.length,
        totalSales: 0,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/branches/[id]:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load branch.",
      },
      { status: 500 }
    );
  }
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
          message: "Invalid branch ID.",
        },
        { status: 400 }
      );
    }

    const branch =
      await db.orm.public.Branch
        .where({ id })
        .first();

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch not found.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const name =
      String(body.name || "").trim();

    const code =
      String(body.code || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-");

    const manager =
      String(body.manager || "").trim();

    const phone =
      String(body.phone || "").trim();

    const address =
      String(body.address || "").trim();

    const status =
      String(body.status || "Active") ===
      "Inactive"
        ? "Inactive"
        : "Active";

    if (!name || !code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Branch name and code are required.",
        },
        { status: 400 }
      );
    }

    const duplicate =
      await db.orm.public.Branch
        .where({ code })
        .first();

    if (
      duplicate &&
      duplicate.id !== id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch code already exists.",
        },
        { status: 409 }
      );
    }

    const updated =
      await db.transaction(async (tx) => {
        const row =
          await tx.orm.public.Branch
            .where({ id })
            .update({
              name,
              code,
              manager,
              phone,
              address,
              status,
            });

        await tx.orm.public.AuditLog.create({
          module: "Branch",
          action: "UPDATE",
          description: `Branch ${name} (${code}) updated.`,
          status: "Success",
        });

        return row;
      });

    return NextResponse.json({
      success: true,
      message: "Branch updated successfully.",
      branch: updated,
    });
  } catch (error) {
    console.error(
      "PUT /api/branches/[id]:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update branch.",
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
          message: "Invalid branch ID.",
        },
        { status: 400 }
      );
    }

    const branch =
      await db.orm.public.Branch
        .where({ id })
        .first();

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch not found.",
        },
        { status: 404 }
      );
    }

    const users =
      await db.orm.public.AppUser
        .where({ branchId: id })
        .all();

    if (users.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete branch because users are assigned to it.",
        },
        { status: 409 }
      );
    }

    await db.transaction(async (tx) => {
      await tx.orm.public.Branch
        .where({ id })
        .delete();

      await tx.orm.public.AuditLog.create({
        module: "Branch",
        action: "DELETE",
        description: `Branch ${branch.name} (${branch.code}) deleted.`,
        status: "Success",
      });
    });

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/branches/[id]:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete branch.",
      },
      { status: 500 }
    );
  }
}
