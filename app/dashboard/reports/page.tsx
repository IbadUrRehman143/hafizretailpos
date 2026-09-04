"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type SaleRow = {
  id: number;
  invoiceNumber: string;
  date: string;
  customer: string;
  items: number;
  payment: string;
  amount: number;
  paidAmount: number;
  remainingBalance: number;
  status: string;
  profit: number;
};

type ReportData = {
  success: boolean;
  period: string;
  currency: string;
  summary: {
    totalSales: number;
    totalOrders: number;
    totalItems: number;
    averageOrder: number;
    grossProfit: number;
    costOfGoods: number;
    totalExpenses: number;
    netProfit: number;
    totalPurchases: number;
    totalReturns: number;
  };
  paymentBreakdown: Record<
    string,
    number
  >;
  sales: SaleRow[];
  topProducts: Array<{
    productId: number;
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }>;
  lowStockProducts: Array<{
    id: number;
    name: string;
    stock: number;
    unit: string;
  }>;
};

const EMPTY: ReportData = {
  success: true,
  period: "Today",
  currency: "PKR",
  summary: {
    totalSales: 0,
    totalOrders: 0,
    totalItems: 0,
    averageOrder: 0,
    grossProfit: 0,
    costOfGoods: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalPurchases: 0,
    totalReturns: 0,
  },
  paymentBreakdown: {},
  sales: [],
  topProducts: [],
  lowStockProducts: [],
};

export default function ReportsPage() {
  const router = useRouter();

  const [period, setPeriod] =
    useState("Today");

  const [data, setData] =
    useState<ReportData>(EMPTY);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/reports?period=${encodeURIComponent(
          period
        )}`,
        { cache: "no-store" }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to load reports."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [period]);

  const formatPrice = (
    price: number
  ) => {
    const value =
      Number(price || 0).toLocaleString(
        "en-PK",
        {
          maximumFractionDigits: 2,
        }
      );

    if (data.currency === "SAR") {
      return `SAR ${value}`;
    }

    if (data.currency === "USD") {
      return `$ ${value}`;
    }

    return `Rs. ${value}`;
  };

  const payments =
    useMemo(
      () =>
        Object.entries(
          data.paymentBreakdown || {}
        ).sort(
          (a, b) => b[1] - a[1]
        ),
      [data.paymentBreakdown]
    );

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Reports
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Live sales, profit and business performance from database
              </p>
            </div>
          </div>

          <select
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 sm:w-auto"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
        </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Sales Revenue"
          value={formatPrice(
            data.summary.totalSales
          )}
          sub={`${data.summary.totalOrders} orders`}
        />
        <Stat
          title="Gross Profit"
          value={formatPrice(
            data.summary.grossProfit
          )}
          sub={`COGS ${formatPrice(
            data.summary.costOfGoods
          )}`}
        />
        <Stat
          title="Expenses"
          value={formatPrice(
            data.summary.totalExpenses
          )}
          sub="Operating expenses"
        />
        <Stat
          title="Net Profit"
          value={formatPrice(
            data.summary.netProfit
          )}
          sub="Gross profit - expenses"
        />
        <Stat
          title="Items / KG Sold"
          value={Number(
            data.summary.totalItems
          ).toLocaleString("en-PK")}
          sub="Combined sold quantity"
        />
        <Stat
          title="Average Order"
          value={formatPrice(
            data.summary.averageOrder
          )}
          sub="Per invoice"
        />
        <Stat
          title="Purchases"
          value={formatPrice(
            data.summary.totalPurchases
          )}
          sub="Supplier purchases"
        />
        <Stat
          title="Completed Returns"
          value={formatPrice(
            data.summary.totalReturns
          )}
          sub="Returned sale value"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Sales Report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {period} database transactions
            </p>
          </div>

          {loading ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Loading reports...
            </div>
          ) : data.sales.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              No sales found for this period.
            </div>
          ) : (
            <>
              {/* MOBILE / TABLET / SMALL DESKTOP CARDS */}
              <div className="divide-y divide-slate-100 xl:hidden">
                {data.sales.map((sale) => (
                  <div key={sale.id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="wrap-break-word font-bold text-blue-600">
                          {sale.invoiceNumber}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(sale.date).toLocaleDateString("en-PK")}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          sale.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : sale.status === "PARTIAL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Customer</p>
                        <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-700">
                          {sale.customer}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Items / KG</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {Number(sale.items).toLocaleString("en-PK", {
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Payment</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {sale.payment}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">Amount</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formatPrice(sale.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-600">Profit</p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">
                        {formatPrice(sale.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE - NO HORIZONTAL SCROLL */}
              <div className="hidden xl:block">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[14%]" />
                    <col className="w-[11%]" />
                    <col className="w-[15%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                  </colgroup>

                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        "Invoice",
                        "Date",
                        "Customer",
                        "Items/KG",
                        "Payment",
                        "Amount",
                        "Profit",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-2.5 py-4 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-2.5 py-4 align-top text-[13px] font-bold text-blue-600">
                          <span className="wrap-break-word">
                            {sale.invoiceNumber}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] text-slate-500">
                          {new Date(sale.date).toLocaleDateString("en-PK")}
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-semibold text-slate-800">
                          <span className="wrap-break-word">{sale.customer}</span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-semibold">
                          {Number(sale.items).toLocaleString("en-PK", {
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600">
                            {sale.payment}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-bold text-slate-900">
                          {formatPrice(sale.amount)}
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-bold text-emerald-700">
                          {formatPrice(sale.profit)}
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              sale.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700"
                                : sale.status === "PARTIAL"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                            }`}
                          >
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Payment Breakdown">
            {payments.length === 0 ? (
              <Empty text="No payments in this period." />
            ) : (
              payments.map(
                ([method, amount]) => (
                  <SummaryRow
                    key={method}
                    label={method}
                    value={formatPrice(
                      amount
                    )}
                  />
                )
              )
            )}
          </Panel>

          <Panel title="Top Products">
            {data.topProducts.length ===
            0 ? (
              <Empty text="No product sales yet." />
            ) : (
              data.topProducts.map(
                (product) => (
                  <div
                    key={
                      product.productId
                    }
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <div className="font-semibold text-slate-800">
                      {product.name}
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>
                        Qty/KG{" "}
                        {Number(
                          product.quantity
                        ).toLocaleString(
                          "en-PK",
                          {
                            maximumFractionDigits:
                              2,
                          }
                        )}
                      </span>
                      <span className="font-bold text-slate-800">
                        {formatPrice(
                          product.revenue
                        )}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </Panel>

          <Panel title="Low Stock">
            {data.lowStockProducts
              .length === 0 ? (
              <Empty text="No low-stock products." />
            ) : (
              data.lowStockProducts
                .slice(0, 8)
                .map((product) => (
                  <SummaryRow
                    key={product.id}
                    label={product.name}
                    value={`${Number(
                      product.stock
                    ).toLocaleString(
                      "en-PK",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )} ${product.unit}`}
                  />
                ))
            )}
          </Panel>
        </div>
      </div>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {sub}
      </p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-bold text-slate-900">
          {title}
        </h2>
      </div>
      <div className="space-y-3 p-5">
        {children}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
      <span className="font-semibold text-slate-700">
        {label}
      </span>
      <span className="font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}
