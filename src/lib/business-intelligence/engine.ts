import { db } from "@/src/prisma/db";
import type { BusinessAlert, BusinessIntelligenceSummary, DateRangeInput } from "./types";

function n(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function asDate(value: unknown): Date | null {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
}
function round(value: number): number {
  return Number(value.toFixed(2));
}
function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}
function normalizeRange(input: DateRangeInput = {}) {
  const now = new Date();
  const defaultEnd = endOfDay(now);
  const defaultStart = startOfDay(new Date(now.getTime() - 29 * 86400000));
  const parsedStart = input.start ? asDate(input.start) : null;
  const parsedEnd = input.end ? asDate(input.end) : null;
  const start = parsedStart ? startOfDay(parsedStart) : defaultStart;
  const end = parsedEnd ? endOfDay(parsedEnd) : defaultEnd;
  if (start.getTime() > end.getTime()) throw new Error("Start date cannot be after end date.");
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
  return { start, end, days };
}
function inRange(value: unknown, start: Date, end: Date): boolean {
  const date = asDate(value);
  if (!date) return false;
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}
function ageDays(value: unknown, now: Date): number {
  const date = asDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}
function growthPercent(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return round(((current - previous) / previous) * 100);
}

export async function getBusinessIntelligence(
  input: DateRangeInput = {}
): Promise<BusinessIntelligenceSummary> {
  const { start, end, days } = normalizeRange(input);
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - (days - 1) * 86400000);
  const now = new Date();

  const [allInvoices, allInvoiceItems, allCustomers, allExpenses, allReturns, allReturnItems] =
    await Promise.all([
      db.orm.public.Invoice.all(),
      db.orm.public.InvoiceItem.all(),
      db.orm.public.Customer.all(),
      db.orm.public.Expense.all(),
      db.orm.public.ReturnRecord.all(),
      db.orm.public.ReturnItem.all(),
    ]);

  const invoices = allInvoices.filter(
    (invoice: any) => Boolean(invoice.finalized) && inRange(invoice.createdAt, start, end)
  );
  const previousInvoices = allInvoices.filter(
    (invoice: any) =>
      Boolean(invoice.finalized) && inRange(invoice.createdAt, previousStart, previousEnd)
  );

  const invoiceIds = new Set(invoices.map((invoice: any) => n(invoice.id)));
  const previousInvoiceIds = new Set(previousInvoices.map((invoice: any) => n(invoice.id)));

  const items = allInvoiceItems.filter((item: any) => invoiceIds.has(n(item.invoiceId)));
  const previousItems = allInvoiceItems.filter((item: any) =>
    previousInvoiceIds.has(n(item.invoiceId))
  );
  const invoiceItemById = new Map<number, any>(
    allInvoiceItems.map((item: any) => [n(item.id), item])
  );

  const completedReturns = allReturns.filter(
    (record: any) =>
      String(record.status || "").toLowerCase() === "completed" &&
      inRange(record.date || record.createdAt, start, end)
  );
  const completedReturnIds = new Set(completedReturns.map((record: any) => n(record.id)));
  const returnItems = allReturnItems.filter((item: any) =>
    completedReturnIds.has(n(item.returnId))
  );

  let returnedRevenue = 0;
  let returnedCost = 0;
  let returnedProfit = 0;

  for (const returned of returnItems as any[]) {
    const sold = invoiceItemById.get(n(returned.invoiceItemId));
    if (!sold) continue;
    const soldQty = Math.max(0, n(sold.quantity));
    const returnedQty = Math.min(Math.max(0, n(returned.quantity)), soldQty);
    if (returnedQty <= 0) continue;

    const revenuePerUnit = soldQty > 0 ? n(sold.amount) / soldQty : n(returned.price);
    const costPerUnit = soldQty > 0 ? n(sold.costAmount) / soldQty : n(sold.purchasePrice);
    const profitPerUnit =
      soldQty > 0 ? n(sold.profitAmount) / soldQty : revenuePerUnit - costPerUnit;

    returnedRevenue += returnedQty * revenuePerUnit;
    returnedCost += returnedQty * costPerUnit;
    returnedProfit += returnedQty * profitPerUnit;
  }

  const grossRevenue = items.reduce((sum: number, item: any) => sum + n(item.amount), 0);
  const previousRevenue = previousItems.reduce(
    (sum: number, item: any) => sum + n(item.amount),
    0
  );
  const paid = invoices.reduce((sum: number, invoice: any) => sum + n(invoice.paidAmount), 0);
  const outstanding = invoices.reduce(
    (sum: number, invoice: any) => sum + Math.max(0, n(invoice.remainingBalance)),
    0
  );

  const retailRevenue = invoices
    .filter((invoice: any) => String(invoice.saleType).toUpperCase() === "RETAIL")
    .reduce((sum: number, invoice: any) => sum + n(invoice.total), 0);
  const wholesaleRevenue = invoices
    .filter((invoice: any) => String(invoice.saleType).toUpperCase() === "WHOLESALE")
    .reduce((sum: number, invoice: any) => sum + n(invoice.total), 0);

  const productMap = new Map<number, any>();
  for (const item of items as any[]) {
    const productId = n(item.productId);
    const current = productMap.get(productId) || {
      productId,
      productName: String(item.productName || `Product ${productId}`),
      unit: String(item.unit || ""),
      quantity: 0,
      revenue: 0,
      profit: 0,
    };
    current.quantity += n(item.quantity);
    current.revenue += n(item.amount);
    current.profit += n(item.profitAmount);
    productMap.set(productId, current);
  }
  const topProducts = [...productMap.values()]
    .map((row) => ({
      ...row,
      quantity: round(row.quantity),
      revenue: round(row.revenue),
      profit: round(row.profit),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const customerAgg = new Map<number, any>();
  for (const invoice of allInvoices as any[]) {
    if (!Boolean(invoice.finalized) || !invoice.customerId) continue;
    const customerId = n(invoice.customerId);
    const row = customerAgg.get(customerId) || {
      customerId,
      name: String(invoice.customerName || `Customer ${customerId}`),
      invoices: 0,
      revenue: 0,
      outstanding: 0,
    };
    row.invoices += 1;
    row.revenue += n(invoice.total);
    row.outstanding += Math.max(0, n(invoice.remainingBalance));
    customerAgg.set(customerId, row);
  }
  const topCustomers = [...customerAgg.values()]
    .map((row) => ({ ...row, revenue: round(row.revenue), outstanding: round(row.outstanding) }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const activeCustomers = [...customerAgg.values()].filter((row) => row.invoices > 0).length;
  const customersWithDue = [...customerAgg.values()].filter((row) => row.outstanding > 0).length;
  const totalCustomerOutstanding = [...customerAgg.values()].reduce(
    (sum, row) => sum + row.outstanding,
    0
  );

  const outstandingInvoices = allInvoices
    .filter((invoice: any) => Boolean(invoice.finalized) && n(invoice.remainingBalance) > 0)
    .map((invoice: any) => ({
      invoiceId: n(invoice.id),
      invoiceNumber: String(invoice.invoiceNumber || ""),
      customerName: String(invoice.customerName || "Walk-in Customer"),
      due: round(Math.max(0, n(invoice.remainingBalance))),
      ageDays: ageDays(invoice.createdAt, now),
      status: String(invoice.status || "").toUpperCase(),
    }));

  const aging = { days0to7: 0, days8to30: 0, days31to60: 0, days61plus: 0 };
  for (const invoice of outstandingInvoices) {
    if (invoice.ageDays <= 7) aging.days0to7 += invoice.due;
    else if (invoice.ageDays <= 30) aging.days8to30 += invoice.due;
    else if (invoice.ageDays <= 60) aging.days31to60 += invoice.due;
    else aging.days61plus += invoice.due;
  }

  const periodExpenses = allExpenses.filter((expense: any) =>
    inRange(expense.date || expense.createdAt, start, end)
  );
  const categoryMap = new Map<string, any>();
  let expenseTotal = 0;
  let expensePaid = 0;
  let expensePending = 0;

  for (const expense of periodExpenses as any[]) {
    const amount = Math.max(0, n(expense.amount));
    const status = String(expense.status || "").toLowerCase();
    const category = String(expense.category || "Other").trim() || "Other";
    expenseTotal += amount;
    if (status === "pending") expensePending += amount;
    else expensePaid += amount;

    const row = categoryMap.get(category) || { category, amount: 0, count: 0 };
    row.amount += amount;
    row.count += 1;
    categoryMap.set(category, row);
  }

  const grossSalesProfit = items.reduce(
    (sum: number, item: any) => sum + n(item.profitAmount),
    0
  );
  const returnAdjustedRevenue = Math.max(0, grossRevenue - returnedRevenue);
  const returnAdjustedGrossProfit = grossSalesProfit - returnedProfit;
  const estimatedOperatingProfit = returnAdjustedGrossProfit - expenseTotal;
  const grossMarginPercent =
    returnAdjustedRevenue > 0
      ? round((returnAdjustedGrossProfit / returnAdjustedRevenue) * 100)
      : null;

  const alerts: BusinessAlert[] = [];
  const growth = growthPercent(grossRevenue, previousRevenue);

  if (growth !== null && growth <= -20) {
    alerts.push({
      id: "sales-drop",
      severity: "HIGH",
      area: "sales",
      title: "Sales dropped significantly",
      message: `Revenue is ${Math.abs(growth)}% lower than the previous comparable period.`,
    });
  } else if (growth !== null && growth < 0) {
    alerts.push({
      id: "sales-soft-drop",
      severity: "WATCH",
      area: "sales",
      title: "Sales are below previous period",
      message: `Revenue is ${Math.abs(growth)}% lower than the previous comparable period.`,
    });
  }

  if (aging.days61plus > 0) {
    alerts.push({
      id: "old-credit",
      severity: "HIGH",
      area: "credit",
      title: "Old customer credit is outstanding",
      message: `Rs. ${round(aging.days61plus).toLocaleString("en-PK")} is older than 60 days.`,
    });
  } else if (aging.days31to60 > 0) {
    alerts.push({
      id: "aging-credit",
      severity: "WATCH",
      area: "credit",
      title: "Customer credit needs follow-up",
      message: `Rs. ${round(aging.days31to60).toLocaleString("en-PK")} is 31–60 days old.`,
    });
  }

  if (
    expenseTotal > 0 &&
    returnAdjustedRevenue > 0 &&
    expenseTotal / returnAdjustedRevenue >= 0.25
  ) {
    alerts.push({
      id: "expense-ratio",
      severity: "WATCH",
      area: "expenses",
      title: "Expenses are high relative to sales",
      message: `Period expenses are ${round(
        (expenseTotal / returnAdjustedRevenue) * 100
      )}% of return-adjusted revenue.`,
    });
  }

  if (estimatedOperatingProfit < 0) {
    alerts.push({
      id: "negative-operating-profit",
      severity: "HIGH",
      area: "profit",
      title: "Estimated operating profit is negative",
      message: `Return-adjusted gross profit minus recorded expenses is Rs. ${round(
        estimatedOperatingProfit
      ).toLocaleString("en-PK")}.`,
    });
  }

  if (completedReturns.length > 0) {
    alerts.push({
      id: "returns-reconciliation",
      severity: "INFO",
      area: "data-quality",
      title: "Returns included in intelligence",
      message:
        "Phase 7 reverses completed-return revenue/cost/profit from item snapshots. Customer due still follows the invoice remainingBalance stored by the POS.",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "stable-period",
      severity: "INFO",
      area: "sales",
      title: "No major business alert detected",
      message:
        "Current deterministic checks did not detect a high-risk sales, credit, expense, or profit condition.",
    });
  }

  return {
    period: { start: start.toISOString(), end: end.toISOString(), days },
    sales: {
      invoices: invoices.length,
      grossRevenue: round(grossRevenue),
      returnAdjustedRevenue: round(returnAdjustedRevenue),
      paid: round(paid),
      outstanding: round(outstanding),
      averageInvoiceValue: round(invoices.length ? grossRevenue / invoices.length : 0),
      retailRevenue: round(retailRevenue),
      wholesaleRevenue: round(wholesaleRevenue),
      currentPeriodRevenue: round(grossRevenue),
      previousPeriodRevenue: round(previousRevenue),
      growthPercent: growth,
      topProducts,
    },
    customers: {
      wholesaleCustomers: allCustomers.length,
      activeCustomers,
      customersWithDue,
      totalOutstanding: round(totalCustomerOutstanding),
      topCustomers,
    },
    credit: {
      totalOutstanding: round(
        outstandingInvoices.reduce((sum, invoice) => sum + invoice.due, 0)
      ),
      unpaidInvoices: outstandingInvoices.filter((invoice) => invoice.status === "UNPAID").length,
      partialInvoices: outstandingInvoices.filter((invoice) => invoice.status === "PARTIAL").length,
      aging: {
        days0to7: round(aging.days0to7),
        days8to30: round(aging.days8to30),
        days31to60: round(aging.days31to60),
        days61plus: round(aging.days61plus),
      },
      highestDueInvoices: outstandingInvoices
        .sort((a, b) => b.due - a.due)
        .slice(0, 10)
        .map(({ status: _status, ...invoice }) => invoice),
    },
    expenses: {
      count: periodExpenses.length,
      total: round(expenseTotal),
      paid: round(expensePaid),
      pending: round(expensePending),
      byCategory: [...categoryMap.values()]
        .map((row) => ({ ...row, amount: round(row.amount) }))
        .sort((a, b) => b.amount - a.amount),
    },
    profitability: {
      grossSalesProfit: round(grossSalesProfit),
      returnAdjustedGrossProfit: round(returnAdjustedGrossProfit),
      operatingExpenses: round(expenseTotal),
      estimatedOperatingProfit: round(estimatedOperatingProfit),
      grossMarginPercent,
    },
    returns: {
      completedReturns: completedReturns.length,
      returnedRevenue: round(returnedRevenue),
      returnedCost: round(returnedCost),
      returnedProfit: round(returnedProfit),
    },
    alerts,
    generatedAt: new Date().toISOString(),
  };
}
