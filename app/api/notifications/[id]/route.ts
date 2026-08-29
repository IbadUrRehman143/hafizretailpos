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
// MARK READ / UNREAD
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
            "Invalid notification ID.",
        },
        {
          status: 400,
        }
      );
    }

    const notification =
      await db.orm.public.Notification
        .where({
          id,
        })
        .first();

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const isRead =
      typeof body.isRead === "boolean"
        ? body.isRead
        : true;

    const updated =
      await db.orm.public.Notification
        .where({
          id,
        })
        .update({
          isRead,
        });

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error(
      "PUT /api/notifications/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to update notification.",
      },
      {
        status: 500,
      }
    );
  }
}

// ======================================================
// DELETE ONE
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
            "Invalid notification ID.",
        },
        {
          status: 400,
        }
      );
    }

    const notification =
      await db.orm.public.Notification
        .where({
          id,
        })
        .first();

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification not found.",
        },
        {
          status: 404,
        }
      );
    }

    await db.orm.public.Notification
      .where({
        id,
      })
      .delete();

    return NextResponse.json({
      success: true,
      message:
        "Notification deleted.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/notifications/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to delete notification.",
      },
      {
        status: 500,
      }
    );
  }
}