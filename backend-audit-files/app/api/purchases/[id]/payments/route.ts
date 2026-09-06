import { NextResponse } from "next/server";

import { db } from "@/src/prisma/db";

/* =====================================================
   TYPES
===================================================== */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PaymentBody = {
  amount?: unknown;
  paymentMethod?: unknown;
  method?: unknown;
};

/* =====================================================
   HELPERS
===================================================== */

function safeNumber(
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

function roundMoney(
  value: number
) {
  return Number(
    value.toFixed(2)
  );
}

function normalizeStatus(
  paidAmount: number,
  totalAmount: number
) {
  if (
    paidAmount <= 0
  ) {
    return "UNPAID";
  }

  if (
    paidAmount >=
    totalAmount
  ) {
    return "PAID";
  }

  return "PARTIAL";
}

/* =====================================================
   GET PURCHASE ID
===================================================== */

async function getPurchaseId(
  context: RouteContext
) {
  const params =
    await context.params;

  const id =
    Number(params.id);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "Invalid purchase ID."
    );
  }

  return id;
}

/* =====================================================
   GET PAYMENT HISTORY

   GET:
   /api/purchases/15/payments
===================================================== */

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const purchaseId =
      await getPurchaseId(
        context
      );

    const purchase =
      await db.orm.public.Purchase
        .where({
          id: purchaseId,
        })
        .first();

    if (!purchase) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Purchase not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Prisma 8 RC safe approach:
     * load payments and filter in JS.
     */

    const allPayments =
      await db.orm.public.PurchasePayment.all();

    const payments =
      allPayments
        .filter(
          (payment) =>
            payment.purchaseId ===
            purchaseId
        )
        .sort(
          (a, b) =>
            b.id - a.id
        );

    return NextResponse.json({
      success: true,

      purchase: {
        id:
          purchase.id,

        purchaseNumber:
          purchase.purchaseNumber,

        supplierId:
          purchase.supplierId,

        supplierName:
          purchase.supplierName,

        subtotal:
          safeNumber(
            purchase.subtotal
          ),

        paidAmount:
          safeNumber(
            purchase.paidAmount
          ),

        remainingBalance:
          safeNumber(
            purchase.remainingBalance
          ),

        status:
          purchase.status,
      },

      payments,
    });
  } catch (error) {
    console.error(
      "GET PURCHASE PAYMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to load supplier payments.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   PAY SUPPLIER

   POST:
   /api/purchases/15/payments

   BODY:
   {
     amount: 5000,
     paymentMethod: "Cash"
   }

   IMPORTANT:
   - NO Product update
   - NO weightEntries update
   - NO InventoryTransaction
   - NO PurchaseItem update
   - ONLY accounting/payment
===================================================== */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const purchaseId =
      await getPurchaseId(
        context
      );

    const body =
      (await request.json()) as PaymentBody;

    const amount =
      roundMoney(
        safeNumber(
          body.amount
        )
      );

    const paymentMethod =
      String(
        body.paymentMethod ||
          body.method ||
          "Cash"
      ).trim() || "Cash";

    /* =================================================
       BASIC VALIDATION
    ================================================= */

    if (
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Payment amount must be greater than 0.",
        },
        {
          status: 400,
        }
      );
    }

    /* =================================================
       TRANSACTION

       This transaction touches ONLY:

       Purchase
       PurchasePayment

       Stock is NOT touched.
    ================================================= */

    const result =
      await db.transaction(
        async (tx) => {
          /* =============================================
             LOAD PURCHASE
          ============================================= */

          const purchase =
            await tx.orm.public.Purchase
              .where({
                id:
                  purchaseId,
              })
              .first();

          if (!purchase) {
            throw new Error(
              "Purchase not found."
            );
          }

          const subtotal =
            roundMoney(
              Math.max(
                0,
                safeNumber(
                  purchase.subtotal
                )
              )
            );

          /* =============================================
             PAYMENT HISTORY IS SOURCE OF PAYMENT EVENTS

             Existing Purchase.paidAmount is retained
             as cumulative accounting value.
          ============================================= */

          const oldPaidAmount =
            roundMoney(
              Math.max(
                0,
                safeNumber(
                  purchase.paidAmount
                )
              )
            );

          const oldRemaining =
            roundMoney(
              Math.max(
                0,
                subtotal -
                  oldPaidAmount
              )
            );

          /* =============================================
             ALREADY PAID
          ============================================= */

          if (
            oldRemaining <= 0
          ) {
            throw new Error(
              `${purchase.purchaseNumber} is already fully paid.`
            );
          }

          /* =============================================
             OVERPAYMENT PROTECTION
          ============================================= */

          if (
            amount >
            oldRemaining
          ) {
            throw new Error(
              `Payment cannot be greater than remaining payable ${oldRemaining.toLocaleString(
                "en-PK",
                {
                  maximumFractionDigits: 2,
                }
              )}.`
            );
          }

          /* =============================================
             NEW TOTALS
          ============================================= */

          const newPaidAmount =
            roundMoney(
              oldPaidAmount +
                amount
            );

          const newRemainingBalance =
            roundMoney(
              Math.max(
                0,
                subtotal -
                  newPaidAmount
              )
            );

          const newStatus =
            normalizeStatus(
              newPaidAmount,
              subtotal
            );

          /* =============================================
             CREATE PAYMENT HISTORY FIRST

             Example:

             Old paid = 60,000
             New payment = 10,000

             PurchasePayment created:
             amount = 10,000

             NOT:
             amount = 70,000
          ============================================= */

          const payment =
            await tx.orm.public.PurchasePayment.create(
              {
                purchaseId:
                  purchase.id,

                method:
                  paymentMethod,

                amount,
              }
            );

          /* =============================================
             UPDATE PURCHASE ACCOUNTING

             NO STOCK FIELDS HERE.
          ============================================= */

          await tx.orm.public.Purchase
            .where({
              id:
                purchase.id,
            })
            .update({
              paidAmount:
                newPaidAmount,

              remainingBalance:
                newRemainingBalance,

              paymentMethod,

              status:
                newStatus,
            });

          /* =============================================
             RELOAD PURCHASE
          ============================================= */

          const updatedPurchase =
            await tx.orm.public.Purchase
              .where({
                id:
                  purchase.id,
              })
              .first();

          if (
            !updatedPurchase
          ) {
            throw new Error(
              "Payment was saved but purchase could not be reloaded."
            );
          }

          return {
            purchase:
              updatedPurchase,

            payment,

            paymentAmount:
              amount,

            previousPaidAmount:
              oldPaidAmount,

            previousRemaining:
              oldRemaining,

            newPaidAmount,

            newRemainingBalance,

            status:
              newStatus,
          };
        }
      );

    /* =================================================
       SUCCESS
    ================================================= */

    return NextResponse.json({
      success: true,

      message:
        result.newRemainingBalance <=
        0
          ? "Supplier fully paid successfully."
          : "Supplier payment recorded successfully.",

      payment:
        result.payment,

      purchase:
        result.purchase,

      summary: {
        paymentAmount:
          result.paymentAmount,

        previousPaidAmount:
          result.previousPaidAmount,

        previousRemaining:
          result.previousRemaining,

        paidAmount:
          result.newPaidAmount,

        remainingBalance:
          result.newRemainingBalance,

        status:
          result.status,
      },
    });
  } catch (error) {
    console.error(
      "PAY SUPPLIER ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to record supplier payment.";

    const notFound =
      message ===
      "Purchase not found.";

    return NextResponse.json(
      {
        success: false,
        message,
        error:
          message,
      },
      {
        status:
          notFound
            ? 404
            : 400,
      }
    );
  }
}