import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import {
  getBusinessSettings,
} from "@/src/lib/businessSettings";

function toDate(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function startOfPeriod(
  period: string,
  now = new Date()
) {
  const start = new Date(now);

  if (period === "Today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "This Week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === "This Month") {
    return new Date(
      start.getFullYear(),
      start.getMonth(),
      1
    );
  }

  if (period === "This Year") {
    return new Date(
      start.getFullYear(),
      0,
      1
    );
  }

  start.setHours(0, 0, 0, 0);
  return start;
}

function insidePeriod(
  value: unknown,
  start: Date,
  end: Date
) {
  const date = toDate(value);
  return Boolean(
    date &&
      date.getTime() >= start.getTime() &&
      date.getTime() <= end.getTime()
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const period =
      request.nextUrl.searchParams.get(
        "period"
      ) || "Today";

    const allowedPeriods = new Set([
      "Today",
      "This Week",
      "This Month",
      "This Year",
    ]);

    const safePeriod =
      allowedPeriods.has(period)
        ? period
        : "Today";

    const now = new Date();
    const start =
      startOfPeriod(safePeriod, now);

    const [
      invoices,
      invoiceItems,
      payments,
      purchases,
      expenses,
      returns,
      returnItems,
      products,
      settings,
    ] = await Promise.all([
      db.orm.public.Invoice.all(),
      db.orm.public.InvoiceItem.all(),
      db.orm.public.Payment.all(),
      db.orm.public.Purchase.all(),
      db.orm.public.Expense.all(),
      db.orm.public.ReturnRecord.all(),
      db.orm.public.ReturnItem.all(),
      db.orm.public.Product.all(),
      getBusinessSettings(),
    ]);

    const filteredInvoices =
      invoices.filter(
        (invoice) =>
          Boolean(invoice.finalized) &&
          insidePeriod(
            invoice.createdAt,
            start,
            now
          )
      );

    const invoiceIds =
      new Set(
        filteredInvoices.map(
          (invoice) => invoice.id
        )
      );

    const filteredItems =
      invoiceItems.filter(
        (item) =>
          invoiceIds.has(item.invoiceId)
      );

    const filteredPayments =
      payments.filter(
        (payment) =>
          invoiceIds.has(payment.invoiceId) &&
          insidePeriod(
            payment.createdAt,
            start,
            now
          )
      );

    const filteredPurchases =
      purchases.filter(
        (purchase) =>
          insidePeriod(
            purchase.purchaseDate ||
              purchase.createdAt,
            start,
            now
          )
      );

    const filteredExpenses =
      expenses.filter(
        (expense) =>
          insidePeriod(
            expense.date ||
              expense.createdAt,
            start,
            now
          )
      );

    const filteredReturns =
      returns.filter(
        (record) =>
          String(record.status) ===
            "Completed" &&
          insidePeriod(
            record.date ||
              record.createdAt,
            start,
            now
          )
      );

    const completedReturnIds =
      new Set(
        filteredReturns.map(
          (record) => record.id
        )
      );

    const filteredReturnItems =
      returnItems.filter(
        (item) =>
          completedReturnIds.has(
            item.returnId
          )
      );

    const totalSales =
      filteredInvoices.reduce(
        (sum, invoice) =>
          sum +
          Number(invoice.total || 0),
        0
      );

    const grossProfit =
      filteredItems.reduce(
        (sum, item) =>
          sum +
          Number(item.profitAmount || 0),
        0
      );

    const costOfGoods =
      filteredItems.reduce(
        (sum, item) =>
          sum +
          Number(item.costAmount || 0),
        0
      );

    const totalExpenses =
      filteredExpenses.reduce(
        (sum, expense) =>
          sum +
          Number(expense.amount || 0),
        0
      );

    const totalPurchases =
      filteredPurchases.reduce(
        (sum, purchase) =>
          sum +
          Number(purchase.subtotal || 0),
        0
      );

    const totalReturns =
      filteredReturns.reduce(
        (sum, record) =>
          sum +
          Number(record.totalAmount || 0),
        0
      );

    const netProfit =
      grossProfit - totalExpenses;

    const totalOrders =
      filteredInvoices.length;

    const totalItems =
      filteredItems.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0),
        0
      );

    const averageOrder =
      totalOrders > 0
        ? totalSales / totalOrders
        : 0;

    const paymentBreakdown:
      Record<string, number> = {};

    for (const payment of filteredPayments) {
      const method =
        String(
          payment.method || "Other"
        );

      paymentBreakdown[method] =
        (paymentBreakdown[method] || 0) +
        Number(payment.amount || 0);
    }

    const sales =
      filteredInvoices
        .map((invoice) => {
          const items =
            filteredItems.filter(
              (item) =>
                item.invoiceId ===
                invoice.id
            );

          const invoicePayments =
            payments.filter(
              (payment) =>
                payment.invoiceId ===
                invoice.id
            );

          return {
            id: invoice.id,
            invoiceNumber:
              invoice.invoiceNumber,
            date: invoice.createdAt,
            customer:
              invoice.customerName ||
              "Walk-in Customer",
            items: items.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.quantity || 0
                ),
              0
            ),
            payment:
              invoicePayments.length > 0
                ? invoicePayments[
                    invoicePayments.length - 1
                  ].method
                : invoice.paymentMethod ||
                  "Credit",
            amount:
              Number(invoice.total || 0),
            paidAmount:
              Number(
                invoice.paidAmount || 0
              ),
            remainingBalance:
              Number(
                invoice.remainingBalance ||
                  0
              ),
            status:
              String(invoice.status || ""),
            profit: items.reduce(
              (sum, item) =>
                sum +
                Number(
                  item.profitAmount || 0
                ),
              0
            ),
          };
        })
        .sort((a, b) => b.id - a.id);

    const productMap =
      new Map<
        number,
        {
          productId: number;
          name: string;
          quantity: number;
          revenue: number;
          profit: number;
        }
      >();

    for (const item of filteredItems) {
      const current =
        productMap.get(item.productId) || {
          productId: item.productId,
          name: item.productName,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };

      current.quantity +=
        Number(item.quantity || 0);

      current.revenue +=
        Number(item.amount || 0);

      current.profit +=
        Number(item.profitAmount || 0);

      productMap.set(
        item.productId,
        current
      );
    }

    const topProducts =
      Array.from(productMap.values())
        .sort(
          (a, b) =>
            b.revenue - a.revenue
        )
        .slice(0, 5);

    const lowStockProducts =
      products
        .map((product) => {
          const stock =
            String(product.type) ===
            "weight"
              ? String(
                  product.weightEntries ||
                    ""
                )
                  .split("+")
                  .map(Number)
                  .filter(
                    (value) =>
                      Number.isFinite(
                        value
                      ) && value > 0
                  )
                  .reduce(
                    (sum, value) =>
                      sum + value,
                    0
                  )
              : Number(
                  product.quantity || 0
                );

          return {
            id: product.id,
            name: product.name,
            stock,
            unit:
              String(product.type) ===
              "weight"
                ? "KG"
                : product.unit || "PCS",
          };
        })
        .filter(
          (product) =>
            product.stock <=
            Number(
              settings.lowStockLimit ||
                0
            )
        )
        .sort(
          (a, b) =>
            a.stock - b.stock
        );

    return NextResponse.json({
      success: true,
      period: safePeriod,
      currency:
        settings.currency || "PKR",
      summary: {
        totalSales,
        totalOrders,
        totalItems,
        averageOrder,
        grossProfit,
        costOfGoods,
        totalExpenses,
        netProfit,
        totalPurchases,
        totalReturns,
      },
      paymentBreakdown,
      sales,
      topProducts,
      lowStockProducts,
      returnItems: filteredReturnItems.length,
    });
  } catch (error) {
    console.error(
      "GET /api/reports:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to generate reports.",
      },
      { status: 500 }
    );
  }
}
