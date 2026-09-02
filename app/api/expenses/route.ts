import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

function clean(body: any) {
  return {
    title: String(body.title || "").trim(),
    category: String(body.category || "Other"),
    amount: Number(body.amount),
    paymentMethod: String(
      body.paymentMethod || "Cash"
    ),
    date: String(body.date || "")
      .slice(0, 10),
    description: String(
      body.description || ""
    ).trim(),
    status: String(
      body.status || "Paid"
    ),
  };
}

export async function GET() {
  try {
    const expenses =
      await db.orm.public.Expense.all();

    return NextResponse.json({
      expenses: expenses.sort(
        (a: any, b: any) =>
          b.id - a.id
      ),
    });
  } catch (e) {
    console.error(
      "GET EXPENSES:",
      e
    );

    return NextResponse.json(
      {
        error:
          "Failed to load expenses.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: Request
) {
  try {
    const body = clean(
      await req.json()
    );

    if (
      !body.title ||
      !Number.isFinite(
        body.amount
      ) ||
      body.amount <= 0
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

    if (!body.date) {
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

    const created =
      await db.transaction(
        async (tx) => {
          const row =
            await tx.orm.public.Expense.create({
              expenseNo:
                "PENDING",
              ...body,
            });

          const updated =
            await tx.orm.public.Expense.where({
              id: row.id,
            }).update({
              expenseNo: `EXP-${String(
                row.id
              ).padStart(
                4,
                "0"
              )}`,
            });

          if (!updated) {
            throw new Error(
              "Expense number update failed."
            );
          }

          return updated;
        }
      );

    return NextResponse.json(
      {
        expense: created,
      },
      {
        status: 201,
      }
    );
  } catch (e) {
    console.error(
      "POST EXPENSE:",
      e
    );

    return NextResponse.json(
      {
        error:
          "Failed to save expense.",
      },
      {
        status: 500,
      }
    );
  }
}