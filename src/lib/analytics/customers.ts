import { db } from "@/src/prisma/db";
import { roundMoney, toNumber } from "./helpers";

export async function getTopCustomers(limit = 10) {
  const [customers, invoices] = await Promise.all([
    db.orm.public.Customer.all(),
    db.orm.public.Invoice.all(),
  ]);

  const cs = customers as unknown as Record<string, unknown>[];
  const inv = invoices as unknown as Record<string, unknown>[];

  return cs.map((c) => {
    const customerId = toNumber(c.id);
    const rows = inv.filter((x) => toNumber(x.customerId) === customerId);
    return {
      customerId,
      customerName: String(c.name ?? c.customerName ?? `Customer ${customerId}`),
      invoices: rows.length,
      revenue: roundMoney(rows.reduce((s, x) => s + toNumber(x.total), 0)),
      paid: roundMoney(rows.reduce((s, x) => s + toNumber(x.paidAmount), 0)),
      due: roundMoney(rows.reduce((s, x) => s + toNumber(x.remainingBalance), 0)),
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, Math.max(1, limit));
}

export async function getCustomerHistory(customerId: number) {
  if (!Number.isInteger(customerId) || customerId <= 0) throw new Error("Invalid customer ID.");

  const [customer, invoices] = await Promise.all([
    db.orm.public.Customer.where({ id: customerId }).first(),
    db.orm.public.Invoice.all(),
  ]);

  if (!customer) throw new Error("Customer not found.");

  const rows = (invoices as unknown as Record<string, unknown>[])
    .filter((x) => toNumber(x.customerId) === customerId);

  return {
    customer,
    invoices: rows,
    summary: {
      invoiceCount: rows.length,
      revenue: roundMoney(rows.reduce((s, x) => s + toNumber(x.total), 0)),
      paid: roundMoney(rows.reduce((s, x) => s + toNumber(x.paidAmount), 0)),
      due: roundMoney(rows.reduce((s, x) => s + toNumber(x.remainingBalance), 0)),
    },
  };
}
