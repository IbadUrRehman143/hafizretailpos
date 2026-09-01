import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

// ======================================================
// GET NOTIFICATIONS
// ======================================================

export async function GET() {
  try {
    const notifications =
      await db.orm.public.Notification.all();

    const result =
      [...notifications].sort(
        (a, b) =>
          b.id - a.id
      );

    return NextResponse.json({
      success: true,
      notifications: result,
    });
  } catch (error) {
    console.error(
      "GET /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load notifications.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// CREATE NOTIFICATION
//
// Sale/payment/stock modules later is API ko
// internally call nahi karenge.
// Direct DB create better hoga.
// Ye endpoint manual/system creation ke liye hai.
// ======================================================

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const type =
      String(
        body.type || "System"
      ).trim();

    const title =
      String(
        body.title || ""
      ).trim();

    const message =
      String(
        body.message || ""
      ).trim();

    const userId =
      body.userId
        ? Number(body.userId)
        : null;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification message is required.",
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

      if (!user) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Notification user not found.",
          },
          {
            status: 404,
          }
        );
      }
    }

    const notification =
      await db.orm.public.Notification.create({
        type,
        title,
        message,
        isRead: false,
        userId,
      });

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to create notification.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// MARK ALL READ / CLEAR ALL
// ======================================================

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const action =
      String(
        body.action || ""
      );

    if (
      action === "mark-all-read"
    ) {
      const notifications =
        await db.orm.public.Notification.all();

      for (
        const notification of
        notifications
      ) {
        if (!notification.isRead) {
          await db.orm.public.Notification
            .where({
              id: notification.id,
            })
            .update({
              isRead: true,
            });
        }
      }

      return NextResponse.json({
        success: true,
        message:
          "All notifications marked as read.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid notification action.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "PUT /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update notifications.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE() {
  try {
    const notifications =
      await db.orm.public.Notification.all();

    for (
      const notification of
      notifications
    ) {
      await db.orm.public.Notification
        .where({
          id: notification.id,
        })
        .delete();
    }

    return NextResponse.json({
      success: true,
      message:
        "All notifications cleared.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to clear notifications.",
      },
      {
        status: 500,
      }
    );
  }
}