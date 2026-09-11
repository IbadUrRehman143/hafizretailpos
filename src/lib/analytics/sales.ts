import { db } from "@/src/prisma/db";
import { endOfDay, getRecordDate, isBetween, roundMoney, startOfDay, toNumber } from "./helpers";
import type { ProductSalesMetric, SalesSummary } from "./types";

function summarize(invoices: Record<string, unknown>[]): SalesSummary {
  return {
    invoiceCount: invoices.length,
    revenue: roundMoney(invoices.reduce((s, x) => s + toNumber(x.total), 0)),
    paid: roundMoney(invoices.reduce((s, x) => s + toNumber(x.paidAmount), 0)),
    due: roundMoney(invoices.reduce((s, x) => s + toNumber(x.remainingBalance), 0)),
  };
}

export async function getTodaySales(): Promise<SalesSummary> {
  const rows = (await db.orm.public.Invoice.all()) as unknown as Record<string, unknown>[];
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);
  return summarize(rows.filter((x) => isBetween(getRecordDate(x), start, end)));
}

export async function getSalesByDateRange(startInput: string | Date, endInput: string | Date) {
  const start = startOfDay(new Date(startInput));
  const end = endOfDay(new Date(endInput));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date range.");
  }
  const rows = (await db.orm.public.Invoice.all()) as unknown as Record<string, unknown>[];
  return summarize(rows.filter((x) => isBetween(getRecordDate(x), start, end)));
}

export async function compareSalesPeriods(
  currentStart: string | Date,
  currentEnd: string | Date,
  previousStart: string | Date,
  previousEnd: string | Date
) {
  const [current, previous] = await Promise.all([
    getSalesByDateRange(currentStart, currentEnd),
    getSalesByDateRange(previousStart, previousEnd),
  ]);

  const revenueChangePercent =
    previous.revenue === 0
      ? current.revenue > 0 ? 100 : 0
      : roundMoney(((current.revenue - previous.revenue) / previous.revenue) * 100);

  return { current, previous, revenueChangePercent };
}

async function productMetrics(): Promise<ProductSalesMetric[]> {
  const items = (await db.orm.public.InvoiceItem.all()) as unknown as Record<string, unknown>[];
  const map = new Map<string, ProductSalesMetric>();

  for (const item of items) {
    const productId = item.productId == null ? null : toNumber(item.productId);
    const productName = String(item.productName ?? item.name ?? `Product ${productId ?? ""}`);
    const key = productId !== null ? `id:${productId}` : `name:${productName}`;
    const quantity = toNumber(item.quantity);
    const rate = toNumber(item.rate);
    const revenue = toNumber(item.total) || quantity * rate;
    const old = map.get(key);

    if (old) {
      old.quantity += quantity;
      old.revenue += revenue;
    } else {
      map.set(key, { productId, productName, quantity, revenue });
    }
  }

  return [...map.values()].map((x) => ({
    ...x,
    quantity: roundMoney(x.quantity),
    revenue: roundMoney(x.revenue),
  }));
}

export async function getTopSellingProducts(limit = 10) {
  return (await productMetrics()).sort((a, b) => b.quantity - a.quantity).slice(0, Math.max(1, limit));
}

export async function getSlowMovingProducts(limit = 10) {
  return (await productMetrics()).sort((a, b) => a.quantity - b.quantity).slice(0, Math.max(1, limit));
}
