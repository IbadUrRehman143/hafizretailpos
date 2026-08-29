"use client";

type Props = {
  totalSales: number;
  totalReceived: number;
  totalReceivable: number;
  totalProfit: number;
  totalInvoices: number;
};

export default function SalesStats({
  totalSales,
  totalReceived,
  totalReceivable,
  totalProfit,
  totalInvoices,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">

      <StatCard
        title="Total Sales"
        value={formatCurrency(totalSales)}
      />

      <StatCard
        title="Received"
        value={formatCurrency(totalReceived)}
      />

      <StatCard
        title="Receivable"
        value={formatCurrency(totalReceivable)}
      />

      <StatCard
        title="Total Profit"
        value={formatCurrency(totalProfit)}
        highlight
      />

      <StatCard
        title="Total Invoices"
        value={totalInvoices.toString()}
      />

    </div>
  );
}

function formatCurrency(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

function StatCard({
  title,
  value,
  highlight = false,
}: {
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-sm font-medium ${
          highlight
            ? "text-emerald-700"
            : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p
        className={`mt-2 text-xl font-bold ${
          highlight
            ? "text-emerald-700"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}