"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Summary = any;

function money(value: unknown) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;
}

function Card({ title, value, note }: { title: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{value}</p>
      {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
    </div>
  );
}

export default function BusinessIntelligencePage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState("30");

  const query = useMemo(() => {
    const count = Math.max(1, Math.min(365, Number(days) || 30));
    const end = new Date();
    const start = new Date(end.getTime() - (count - 1) * 86400000);
    return `start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`;
  }, [days]);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/business-intelligence?${query}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result?.success) throw new Error(result?.message || "Unable to load business intelligence.");
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load business intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <span aria-hidden="true">←</span>
          Back to Dashboard
        </Link>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Phase 7 · Verified Business Intelligence</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Sales, Customer & Expense Intelligence</h1>
            <p className="mt-1 text-sm text-slate-500">PostgreSQL → deterministic intelligence → verified AI tools.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={days} onChange={(e) => setDays(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button onClick={() => void load()} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Refresh</button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">Loading verified intelligence…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>
        ) : data ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Card title="Return-adjusted Sales" value={money(data.sales.returnAdjustedRevenue)} note={`${data.sales.invoices} invoices`} />
              <Card title="Outstanding Credit" value={money(data.credit.totalOutstanding)} note={`${data.credit.unpaidInvoices + data.credit.partialInvoices} due invoices`} />
              <Card title="Expenses" value={money(data.expenses.total)} note={`${data.expenses.count} records`} />
              <Card title="Est. Operating Profit" value={money(data.profitability.estimatedOperatingProfit)} note={data.profitability.grossMarginPercent == null ? "No revenue" : `${data.profitability.grossMarginPercent}% gross margin`} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-bold text-slate-950">Sales Intelligence</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Card title="Gross Sales" value={money(data.sales.grossRevenue)} />
                  <Card title="Paid" value={money(data.sales.paid)} />
                  <Card title="Period Due" value={money(data.sales.outstanding)} />
                  <Card title="Avg Invoice" value={money(data.sales.averageInvoiceValue)} />
                  <Card title="Retail" value={money(data.sales.retailRevenue)} />
                  <Card title="Wholesale" value={money(data.sales.wholesaleRevenue)} />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-bold text-slate-950">Credit Aging</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Card title="0–7 Days" value={money(data.credit.aging.days0to7)} />
                  <Card title="8–30 Days" value={money(data.credit.aging.days8to30)} />
                  <Card title="31–60 Days" value={money(data.credit.aging.days31to60)} />
                  <Card title="61+ Days" value={money(data.credit.aging.days61plus)} />
                </div>
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-bold text-slate-950">Top Products</h2>
                <div className="mt-3 space-y-2">
                  {data.sales.topProducts.length ? data.sales.topProducts.map((item: any, index: number) => (
                    <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                      <div><p className="font-semibold text-slate-900">{index + 1}. {item.productName}</p><p className="text-xs text-slate-500">{item.quantity} {item.unit} sold</p></div>
                      <div className="text-right"><p className="font-bold text-slate-900">{money(item.revenue)}</p><p className="text-xs text-slate-500">Profit {money(item.profit)}</p></div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No sales in this period.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-bold text-slate-950">Business Alerts</h2>
                <div className="mt-3 space-y-2">
                  {data.alerts.map((alert: any) => (
                    <div key={alert.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2"><p className="font-semibold text-slate-900">{alert.title}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{alert.severity}</span></div>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-bold text-slate-950">Top Customers</h2>
                <div className="mt-3 space-y-2">
                  {data.customers.topCustomers.length ? data.customers.topCustomers.map((customer: any) => (
                    <div key={customer.customerId} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                      <div><p className="font-semibold">{customer.name}</p><p className="text-xs text-slate-500">{customer.invoices} invoices</p></div>
                      <div className="text-right"><p className="font-bold">{money(customer.revenue)}</p><p className="text-xs text-slate-500">Due {money(customer.outstanding)}</p></div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No wholesale customer history.</p>}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="font-bold text-slate-950">Expense Categories</h2>
                <div className="mt-3 space-y-2">
                  {data.expenses.byCategory.length ? data.expenses.byCategory.map((item: any) => (
                    <div key={item.category} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                      <div><p className="font-semibold">{item.category}</p><p className="text-xs text-slate-500">{item.count} expenses</p></div><p className="font-bold">{money(item.amount)}</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">No expense records in this period.</p>}
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
