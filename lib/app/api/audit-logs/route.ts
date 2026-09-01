import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

// ======================================================
// GET AUDIT LOGS
// ======================================================

export async function GET() {
  try {
    const logs =
      await db.orm.public.AuditLog.all();

    const result =
      [...logs].sort(
        (a, b) =>
          b.id - a.id
      );

    return NextResponse.json({
      success: true,
      logs: result,
    });
  } catch (error) {
    console.error(
      "GET /api/audit-logs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load audit logs.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// CREATE AUDIT LOG
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const module =
      String(
        body.module || "System"
      ).trim();

    const action =
      String(
        body.action || ""
      ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const status =
      String(
        body.status || "Success"
      ).trim();

    const ipAddress =
      String(
        body.ipAddress || ""
      ).trim();

    const userId =
      body.userId
        ? Number(body.userId)
        : null;

    let userName =
      String(
        body.userName || ""
      ).trim();

    let userRole =
      String(
        body.userRole || ""
      ).trim();

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Audit action is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId) {
      const user =
        await db.orm.public.AppUser
          .where({
            id: userId,
          })
          .first();

      if (user) {
        userName =
          user.name;

        if (user.roleId) {
          const role =
            await db.orm.public.Role
              .where({
                id: user.roleId,
              })
              .first();

          if (role) {
            userRole =
              role.name;
          }
        }
      }
    }

    const log =
      await db.orm.public.AuditLog.create({
        module,
        action,
        description,
        status:
          status === "Failed"
            ? "Failed"
            : status === "Warning"
            ? "Warning"
            : "Success",
        ipAddress,
        userId,
        userName,
        userRole,
      });

    return NextResponse.json(
      {
        success: true,
        log,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/audit-logs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create audit log.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// CLEAR ALL LOGS
// ======================================================

export async function DELETE() {
  try {
    const logs =
      await db.orm.public.AuditLog.all();

    for (
      const log of logs
    ) {
      await db.orm.public.AuditLog
        .where({
          id: log.id,
        })
        .delete();
    }

    return NextResponse.json({
      success: true,
      message:
        "Audit logs cleared successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/audit-logs error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to clear audit logs.",
      },
      {
        status: 500,
      }
    );
  }
}





