import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

export async function GET() {
  try {
    const [branches, users] =
      await Promise.all([
        db.orm.public.Branch.all(),
        db.orm.public.AppUser.all(),
      ]);

    const result =
      branches
        .map((branch) => ({
          ...branch,
          totalUsers: users.filter(
            (user) =>
              user.branchId === branch.id
          ).length,
          totalSales: 0,
        }))
        .sort((a, b) => a.id - b.id);

    return NextResponse.json({
      success: true,
      branches: result,
    });
  } catch (error) {
    console.error(
      "GET /api/branches:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load branches.",
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

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch code already exists.",
        },
        { status: 409 }
      );
    }

    const branch =
      await db.transaction(async (tx) => {
        const created =
          await tx.orm.public.Branch.create({
            name,
            code,
            manager,
            phone,
            address,
            status,
          });

        await tx.orm.public.AuditLog.create({
          module: "Branch",
          action: "CREATE",
          description: `Branch ${name} (${code}) created.`,
          status: "Success",
        });

        return created;
      });

    return NextResponse.json(
      {
        success: true,
        message: "Branch created successfully.",
        branch: {
          ...branch,
          totalUsers: 0,
          totalSales: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/branches:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create branch.",
      },
      { status: 500 }
    );
  }
}
