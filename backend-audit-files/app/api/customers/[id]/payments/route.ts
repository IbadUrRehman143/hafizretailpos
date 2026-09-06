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

function getCreatedTime(
  value: unknown
) {
  const time =
    new Date(
      String(value || "")
    ).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

/* =========================================================
   GET CUSTOMER PAYMENT HISTORY
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const customerId =
      Number(id);

    if (
      !Number.isInteger(
        customerId
      ) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid customer ID.",
        },
        {
          status: 400,
        }
      );
    }

    const customer =
      await db.orm.public.Customer.where(
        {
          id: customerId,
        }
      ).first();

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Prisma 8 RC ke non-ID filter issue
      se bachne ke liye invoices .all()
      se load karke JS mein filter kar rahe hain.
    */

    const [
      allInvoices,
      allPayments,
    ] = await Promise.all([
      db.orm.public.Invoice.all(),
      db.orm.public.Payment.all(),
    ]);

    const customerInvoices =
      allInvoices.filter(
        (invoice) =>
          invoice.customerId ===
          customerId
      );

    const invoiceIds =
      new Set(
        customerInvoices.map(
          (invoice) =>
            invoice.id
        )
      );

    const invoiceMap =
      new Map(
        customerInvoices.map(
          (invoice) => [
            invoice.id,
            invoice,
          ]
        )
      );

    const payments =
      allPayments
        .filter(
          (payment) =>
            invoiceIds.has(
              payment.invoiceId
            )
        )
        .map(
          (payment) => {
            const invoice =
              invoiceMap.get(
                payment.invoiceId
              );

            return {
              id:
                payment.id,

              invoiceId:
                payment.invoiceId,

              invoiceNumber:
                invoice
                  ?.invoiceNumber ||
                "",

              method:
                payment.method,

              amount:
                safeNumber(
                  payment.amount
                ),

              createdAt:
                payment.createdAt,
            };
          }
        )
        .sort(
          (a, b) =>
            getCreatedTime(
              b.createdAt
            ) -
            getCreatedTime(
              a.createdAt
            )
        );

    const totalSales =
      customerInvoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          safeNumber(
            invoice.total
          ),
        0
      );

    const totalPaid =
      customerInvoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          safeNumber(
            invoice.paidAmount
          ),
        0
      );

    const receivable =
      customerInvoices.reduce(
        (
          sum,
          invoice
        ) =>
          sum +
          safeNumber(
            invoice.remainingBalance
          ),
        0
      );

    return NextResponse.json({
      success: true,

      customer: {
        id:
          customer.id,

        name:
          customer.name,

        phone:
          customer.phone,

        totalSales:
          roundMoney(
            totalSales
          ),

        totalPaid:
          roundMoney(
            totalPaid
          ),

        receivable:
          roundMoney(
            receivable
          ),
      },

      payments,
    });
  } catch (error) {
    console.error(
      "GET /api/customers/[id]/payments error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to load customer payment history.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST RECEIVE CUSTOMER PAYMENT
========================================================= */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const customerId =
      Number(id);

    if (
      !Number.isInteger(
        customerId
      ) ||
      customerId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid customer ID.",
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
        safeNumber(
          body.amount
        )
      );

    const paymentMethod =
      String(
        body.paymentMethod ||
          body.method ||
          "Cash"
      ).trim() ||
      "Cash";

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

    /*
      PAYMENT-ONLY TRANSACTION

      IMPORTANT:
      - Product stock touch nahi hoga
      - Weight bundles touch nahi hongi
      - InvoiceItem touch nahi hoga
      - InventoryTransaction touch nahi hoga
      - Sirf Payment + Invoice accounting update hogi
    */

    const result =
      await db.transaction(
        async (tx) => {
          const customer =
            await tx.orm.public.Customer.where(
              {
                id: customerId,
              }
            ).first();

          if (!customer) {
            throw new Error(
              "CUSTOMER_NOT_FOUND"
            );
          }

          /*
            Customer ki tamam invoices
            load karke JS filter.

            Oldest outstanding invoice
            pehle pay hogi.
          */

          const allInvoices =
            await tx.orm.public.Invoice.all();

          const customerInvoices =
            allInvoices
              .filter(
                (invoice) =>
                  invoice.customerId ===
                  customerId
              )
              .filter(
                (invoice) =>
                  safeNumber(
                    invoice.remainingBalance
                  ) > 0
              )
              .sort(
                (a, b) =>
                  getCreatedTime(
                    a.createdAt
                  ) -
                  getCreatedTime(
                    b.createdAt
                  )
              );

          const totalReceivable =
            roundMoney(
              customerInvoices.reduce(
                (
                  sum,
                  invoice
                ) =>
                  sum +
                  safeNumber(
                    invoice.remainingBalance
                  ),
                0
              )
            );

          if (
            totalReceivable <= 0
          ) {
            throw new Error(
              "NO_RECEIVABLE"
            );
          }

          if (
            amount >
            totalReceivable
          ) {
            throw new Error(
              `OVERPAYMENT:${totalReceivable}`
            );
          }

          let amountLeft =
            amount;

          const allocations: {
            invoiceId: number;
            invoiceNumber: string;
            amount: number;
            previousRemaining: number;
            newRemaining: number;
          }[] = [];

          for (
            const invoice
            of customerInvoices
          ) {
            if (
              amountLeft <= 0
            ) {
              break;
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
              continue;
            }

            const allocation =
              roundMoney(
                Math.min(
                  amountLeft,
                  oldRemaining
                )
              );

            if (
              allocation <= 0
            ) {
              continue;
            }

            const newPaid =
              roundMoney(
                oldPaid +
                  allocation
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

            /*
              Append-only payment history.
            */

            await tx.orm.public.Payment.create(
              {
                invoiceId:
                  invoice.id,

                method:
                  paymentMethod,

                amount:
                  allocation,
              }
            );

            /*
              Invoice accounting only.
            */

            await tx.orm.public.Invoice.where(
              {
                id:
                  invoice.id,
              }
            ).update({
              paidAmount:
                newPaid,

              remainingBalance:
                newRemaining,

              paymentMethod,

              status,
            });

            allocations.push({
              invoiceId:
                invoice.id,

              invoiceNumber:
                invoice.invoiceNumber,

              amount:
                allocation,

              previousRemaining:
                oldRemaining,

              newRemaining,
            });

            amountLeft =
              roundMoney(
                amountLeft -
                  allocation
              );
          }

          if (
            amountLeft > 0
          ) {
            throw new Error(
              "PAYMENT_ALLOCATION_FAILED"
            );
          }

          const newReceivable =
            roundMoney(
              totalReceivable -
                amount
            );

          return {
            customer,
            allocations,
            previousReceivable:
              totalReceivable,
            receivedAmount:
              amount,
            newReceivable,
          };
        }
      );

    return NextResponse.json({
      success: true,

      message:
        result.newReceivable <= 0
          ? "Customer payment received. Account receivable is fully cleared."
          : "Customer payment received successfully.",

      payment: {
        customerId:
          result.customer.id,

        customerName:
          result.customer.name,

        amount:
          result.receivedAmount,

        paymentMethod,

        previousReceivable:
          result.previousReceivable,

        remainingReceivable:
          result.newReceivable,

        allocations:
          result.allocations,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/customers/[id]/payments error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "CUSTOMER_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Customer not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      message ===
      "NO_RECEIVABLE"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This customer has no outstanding invoice receivable.",
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
            `Payment cannot be greater than customer receivable Rs. ${remaining.toLocaleString(
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
      "PAYMENT_ALLOCATION_FAILED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment could not be fully allocated to customer invoices.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to receive customer payment.",
      },
      {
        status: 500,
      }
    );
  }
}