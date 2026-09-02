import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

function idOf(
  params: { id: string }
) {
  return Number(params.id);
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const id = idOf(
      await params
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid expense ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.json();

    const old =
      await db.orm.public.Expense.where({
        id,
      }).first();

    if (!old) {
      return NextResponse.json(
        {
          error:
            "Expense not found.",
        },
        {
          status: 404,
        }
      );
    }

    const amount =
      Number(body.amount);

    const title =
      String(
        body.title || ""
      ).trim();

    if (
      !title ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valid title and amount are required.",
        },
        {
          status: 400,
        }
      );
    }

    const date =
      String(
        body.date || ""
      ).slice(0, 10);

    if (!date) {
      return NextResponse.json(
        {
          error:
            "Expense date is required.",
        },
        {
          status: 400,
        }
      );
    }

    const expense =
      await db.orm.public.Expense.where({
        id,
      }).update({
        title,
        category: String(
          body.category ||
            "Other"
        ),
        amount,
        paymentMethod: String(
          body.paymentMethod ||
            "Cash"
        ),
        date,
        description: String(
          body.description ||
            ""
        ).trim(),
        status: String(
          body.status ||
            "Paid"
        ),
      });

    if (!expense) {
      return NextResponse.json(
        {
          error:
            "Expense update failed.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      expense,
    });
  } catch (e) {
    console.error(
      "PATCH EXPENSE:",
      e
    );

    return NextResponse.json(
      {
        error:
          "Failed to update expense.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const id = idOf(
      await params
    );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid expense ID.",
        },
        {
          status: 400,
        }
      );
    }

    const old =
      await db.orm.public.Expense.where({
        id,
      }).first();

    if (!old) {
      return NextResponse.json(
        {
          error:
            "Expense not found.",
        },
        {
          status: 404,
        }
      );
    }

    await db.orm.public.Expense.where({
      id,
    }).delete();

    return NextResponse.json({
      success: true,
    });
  } catch (e) {
    console.error(
      "DELETE EXPENSE:",
      e
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete expense.",
      },
      {
        status: 500,
      }
    );
  }
}