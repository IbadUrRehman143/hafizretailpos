import {
  NextResponse,
} from "next/server";

import {
  db,
} from "@/src/prisma/db";

/* =====================================================
   TYPES
===================================================== */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Credit"
  | "Other";

type PaymentBody = {
  amount?: number;

  method?: PaymentMethod;
};

/* =====================================================
   SAFE NUMBER
===================================================== */

function numberValue(
  value: unknown
) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =====================================================
   SAFE PAYMENT METHOD
===================================================== */

function normalizePaymentMethod(
  value: unknown
): PaymentMethod {
  const method =
    String(
      value || "Cash"
    );

  if (
    method === "Bank" ||
    method === "Credit" ||
    method === "Other"
  ) {
    return method;
  }

  return "Cash";
}

/* =====================================================
   GET PAYMENT HISTORY
===================================================== */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    const invoiceId =
      Number(id);

    /* =============================================
       VALIDATE ID
    ============================================= */

    if (
      !Number.isInteger(
        invoiceId
      ) ||
      invoiceId <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid invoice ID.",
        },
        {
          status: 400,
        }
      );
    }

    /* =============================================
       LOAD INVOICE
    ============================================= */

    const invoice =
      await db.orm.public.Invoice
        .where({
          id:
            invoiceId,
        })
        .first();

    if (
      !invoice
    ) {
      return NextResponse.json(
        {
          message:
            "Invoice not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =============================================
       LOAD PAYMENT HISTORY
    ============================================= */

    const payments =
      await db.orm.public.Payment
        .where({
          invoiceId,
        })
        .all();

    const sortedPayments =
      payments.sort(
        (
          a,
          b
        ) =>
          Number(
            b.id
          ) -
          Number(
            a.id
          )
      );

    /* =============================================
       RESPONSE
    ============================================= */

    return NextResponse.json(
      {
        invoiceId:
          invoice.id,

        invoiceNumber:
          invoice.invoiceNumber,

        total:
          numberValue(
            invoice.total
          ),

        paidAmount:
          numberValue(
            invoice.paidAmount
          ),

        remainingBalance:
          numberValue(
            invoice.remainingBalance
          ),

        /*
         * Change ka matlab ab:
         *
         * Latest Receive Payment amount
         *
         * Example:
         *
         * Total = 30,000
         * Paid = 20,000
         * Receive = 5,000
         *
         * Change = 5,000
         */
        changeAmount:
          numberValue(
            invoice.changeAmount
          ),

        status:
          invoice.status,

        payments:
          sortedPayments,
      }
    );
  } catch (error) {
    console.error(
      "LOAD PAYMENT HISTORY ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          error instanceof
            Error
            ? error.message
            : "Unable to load payment history.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   RECEIVE PAYMENT
===================================================== */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const {
      id,
    } =
      await context.params;

    const invoiceId =
      Number(id);

    /* =============================================
       VALIDATE INVOICE ID
    ============================================= */

    if (
      !Number.isInteger(
        invoiceId
      ) ||
      invoiceId <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid invoice ID.",
        },
        {
          status: 400,
        }
      );
    }

    /* =============================================
       REQUEST BODY
    ============================================= */

    const body =
      (await request.json()) as PaymentBody;

    const amount =
      Math.max(
        0,
        numberValue(
          body.amount
        )
      );

    const method =
      normalizePaymentMethod(
        body.method
      );

    /* =============================================
       VALIDATE AMOUNT
    ============================================= */

    if (
      amount <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Payment amount must be greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    /* =============================================
       TRANSACTION
    ============================================= */

    const result =
      await db.transaction(
        async (
          tx
        ) => {
          /* =========================================
             LOAD INVOICE
          ========================================= */

          const invoice =
            await tx.orm.public.Invoice
              .where({
                id:
                  invoiceId,
              })
              .first();

          if (
            !invoice
          ) {
            throw new Error(
              "Invoice not found."
            );
          }

          /* =========================================
             CURRENT VALUES
          ========================================= */

          const total =
            Math.max(
              0,
              numberValue(
                invoice.total
              )
            );

          const currentPaid =
            Math.max(
              0,
              numberValue(
                invoice.paidAmount
              )
            );

          const currentRemaining =
            Math.max(
              0,
              numberValue(
                invoice.remainingBalance
              )
            );

          /* =========================================
             ALREADY FULLY PAID
          ========================================= */

          if (
            currentRemaining <=
            0
          ) {
            throw new Error(
              "This invoice is already fully paid."
            );
          }

          /* =========================================
             PREVENT OVER PAYMENT
          ========================================= */

          if (
            amount >
            currentRemaining
          ) {
            throw new Error(
              `Payment cannot be greater than remaining balance Rs. ${currentRemaining.toLocaleString(
                "en-PK"
              )}.`
            );
          }

          /* =========================================
             CALCULATE NEW PAYMENT VALUES

             Example:

             Total       = 30,000
             Old Paid    = 20,000
             Receive Now = 5,000

             New Paid    = 25,000
             Remaining   = 5,000
             Change      = 5,000
          ========================================= */

          const newPaidAmount =
            Math.min(
              total,
              currentPaid +
                amount
            );

          const newRemainingBalance =
            Math.max(
              0,
              total -
                newPaidAmount
            );

          /* =========================================
             STATUS
          ========================================= */

          let status:
            | "Paid"
            | "Partial"
            | "Unpaid" =
            "Unpaid";

          if (
            total > 0 &&
            newRemainingBalance <=
              0
          ) {
            status =
              "Paid";
          } else if (
            newPaidAmount >
            0
          ) {
            status =
              "Partial";
          }

          /* =========================================
             CREATE PAYMENT HISTORY

             IMPORTANT:
             Har payment alag record rahegi.
          ========================================= */

          const payment =
            await tx.orm.public.Payment.create({
              invoiceId,

              method,

              amount,
            });

          /* =========================================
             UPDATE INVOICE

             IMPORTANT:

             changeAmount =
             latest received payment

             Stock ko yahan bilkul touch nahi karna.
          ========================================= */

          await tx.orm.public.Invoice
            .where({
              id:
                invoiceId,
            })
            .update({
              paidAmount:
                newPaidAmount,

              remainingBalance:
                newRemainingBalance,

              /*
               * MAIN FIX
               *
               * Pehle:
               * changeAmount: 0
               *
               * Ab:
               * Change = current receive payment.
               */
              changeAmount:
                amount,

              status,
            });

          /* =========================================
             SUCCESS RESULT
          ========================================= */

          return {
            payment,

            invoice: {
              id:
                invoice.id,

              invoiceNumber:
                invoice.invoiceNumber,

              total,

              /*
               * Total paid till now
               */
              paidAmount:
                newPaidAmount,

              /*
               * Remaining receivable
               */
              remainingBalance:
                newRemainingBalance,

              /*
               * Latest receive payment
               */
              changeAmount:
                amount,

              status,
            },
          };
        }
      );

    /* =============================================
       SUCCESS RESPONSE
    ============================================= */

    return NextResponse.json(
      {
        message:
          "Payment received successfully.",

        ...result,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "RECEIVE PAYMENT ERROR:",
      error
    );

    const message =
      error instanceof
        Error
        ? error.message
        : "Unable to receive payment.";

    const isNotFound =
      message.includes(
        "not found"
      );

    const isBusinessError =
      isNotFound ||
      message.includes(
        "already fully paid"
      ) ||
      message.includes(
        "greater than remaining"
      );

    return NextResponse.json(
      {
        message,
      },
      {
        status:
          isNotFound
            ? 404
            : isBusinessError
              ? 400
              : 500,
      }
    );
  }
}