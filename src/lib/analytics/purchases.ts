import { db } from "@/src/prisma/db";
import { endOfDay, getRecordDate, isBetween, roundMoney, startOfDay, toNumber } from "./helpers";

export async function getPurchases(startInput?: string | Date, endInput?: string | Date) {
  const rows = (await db.orm.public.Purchase.all()) as unknown as Record<string, unknown>[];
  let filtered = rows;

  if (startInput && endInput) {
    const start = startOfDay(new Date(startInput));
    const end = endOfDay(new Date(endInput));
    filtered = rows.filter((x) => isBetween(getRecordDate(x), start, end));
  }

  return {
    count: filtered.length,
    total: roundMoney(filtered.reduce((s, x) => s + toNumber(x.total ?? x.totalAmount), 0)),
    paid: roundMoney(filtered.reduce((s, x) => s + toNumber(x.paidAmount), 0)),
    due: roundMoney(filtered.reduce((s, x) => s + toNumber(x.remainingBalance ?? x.dueAmount), 0)),
    purchases: filtered,
  };
}
