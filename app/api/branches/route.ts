import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

// ======================================================
// GET ALL BRANCHES
// ======================================================

export async function GET() {
  try {
    const [
      branches,
      users,
    ] = await Promise.all([
      db.orm.public.Branch.all(),
      db.orm.public.AppUser.all(),
    ]);

    const result =
      branches
        .map((branch) => {
          const totalUsers =
            users.filter(
              (user) =>
                user.branchId ===
                branch.id
            ).length;

          return {
            ...branch,

            totalUsers,

            // Sales branch relation abhi
            // existing Invoice schema mein nahi.
            totalSales: 0,
          };
        })
        .sort(
          (a, b) =>
            a.id - b.id
        );

    return NextResponse.json({
      success: true,
      branches: result,
    });
  } catch (error) {
    console.error(
      "GET /api/branches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load branches.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// CREATE BRANCH
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

    const code =
      String(
        body.code || ""
      )
        .trim()
        .toUpperCase();

    const manager =
      String(
        body.manager || ""
      ).trim();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const address =
      String(
        body.address || ""
      ).trim();

    const status =
      String(
        body.status || "Active"
      ).trim();

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Branch name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Branch code is required.",
        },
        {
          status: 400,
        }
      );
    }

    const duplicate =
      await db.orm.public.Branch
        .where({
          code,
        })
        .first();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Branch code already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const branch =
      await db.orm.public.Branch.create({
        name,
        code,
        manager,
        phone,
        address,
        status:
          status === "Inactive"
            ? "Inactive"
            : "Active",
      });

    return NextResponse.json(
      {
        success: true,
        message:
          "Branch created successfully.",
        branch: {
          ...branch,
          totalUsers: 0,
          totalSales: 0,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/branches error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create branch.",
      },
      {
        status: 500,
      }
    );
  }
}