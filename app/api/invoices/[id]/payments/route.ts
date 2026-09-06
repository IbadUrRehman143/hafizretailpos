import { NextResponse } from "next/server";
import { db } from "@/src/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function safeNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function roundMoney(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

function getInvoiceStatus(
  total: number,
  paidAmount: number,
  remainingBalance: number
) {
  if (
    remainingBalance <= 0 ||
    paidAmount >= total
  ) {
    return "PAID";
  }

  if (paidAmount > 0) {
    return "PARTIAL";
  }

  return "UNPAID";
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const invoiceId =
      Number(id);

    if (
      !Number.isInteger(invoiceId) ||
      invoiceId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid invoice ID.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const amount =
      roundMoney(
        safeNumber(body.amount)
      );

    const paymentMethod =
      String(
        body.paymentMethod ||
          body.method ||
          "Cash"
      ).trim() || "Cash";

    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment amount must be greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await db.transaction(
        async (tx) => {
          const invoice =
            await tx.orm.public.Invoice
              .where({
                id: invoiceId,
              })
              .first();

          if (!invoice) {
            throw new Error(
              "INVOICE_NOT_FOUND"
            );
          }

          const invoiceTotal =
            roundMoney(
              safeNumber(
                invoice.total
              )
            );

          const oldPaid =
            roundMoney(
              safeNumber(
                invoice.paidAmount
              )
            );

          const oldRemaining =
            roundMoney(
              safeNumber(
                invoice.remainingBalance
              )
            );

          if (
            oldRemaining <= 0
          ) {
            throw new Error(
              "INVOICE_ALREADY_PAID"
            );
          }

          if (
            amount >
            oldRemaining
          ) {
            throw new Error(
              `OVERPAYMENT:${oldRemaining}`
            );
          }

          const newPaid =
            roundMoney(
              oldPaid + amount
            );

          const newRemaining =
            roundMoney(
              Math.max(
                0,
                invoiceTotal -
                  newPaid
              )
            );

          const status =
            getInvoiceStatus(
              invoiceTotal,
              newPaid,
              newRemaining
            );

          const payment =
            await tx.orm.public.Payment.create({
              invoiceId:
                invoice.id,

              method:
                paymentMethod,

              amount,
            });

          const updatedInvoice =
            await tx.orm.public.Invoice
              .where({
                id:
                  invoice.id,
              })
              .update({
                paidAmount:
                  newPaid,

                remainingBalance:
                  newRemaining,

                paymentMethod,

                status,
              });

          if (
            !updatedInvoice
          ) {
            throw new Error(
              "INVOICE_UPDATE_FAILED"
            );
          }

          return {
            invoiceId:
              updatedInvoice.id,

            invoiceNumber:
              updatedInvoice.invoiceNumber,

            total:
              invoiceTotal,

            previousPaid:
              oldPaid,

            receivedAmount:
              amount,

            paidAmount:
              newPaid,

            previousRemaining:
              oldRemaining,

            remainingBalance:
              newRemaining,

            paymentMethod,

            status,

            paymentId:
              payment.id,
          };
        }
      );

    return NextResponse.json({
      success: true,

      message:
        result.remainingBalance <=
        0
          ? "Payment received. Invoice is fully paid."
          : "Payment received successfully.",

      payment: result,
    });
  } catch (error) {
    console.error(
      "POST /api/invoices/[id]/payments error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "INVOICE_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invoice not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      message ===
      "INVOICE_ALREADY_PAID"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This invoice is already fully paid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      message.startsWith(
        "OVERPAYMENT:"
      )
    ) {
      const remaining =
        safeNumber(
          message.split(":")[1]
        );

      return NextResponse.json(
        {
          success: false,
          error:
            `Payment cannot be greater than remaining balance Rs. ${remaining.toLocaleString(
              "en-PK"
            )}.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      message ===
      "INVOICE_UPDATE_FAILED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invoice could not be updated.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to receive invoice payment.",
      },
      {
        status: 500,
      }
    );
  }
}