"use client";

type Props = {
  totalSales: number;
  totalReceived: number;
  totalReceivable: number;
  totalInvoices: number;
};

export default function SalesStats({
  totalSales,
  totalReceived,
  totalReceivable,
  totalInvoices,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

      <StatCard
        title="Total Sales"
        value={formatCurrency(
          totalSales
        )}
      />

      <StatCard
        title="Received"
        value={formatCurrency(
          totalReceived
        )}
      />

      <StatCard
        title="Receivable"
        value={formatCurrency(
          totalReceivable
        )}
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
  return `Rs. ${value.toLocaleString()}`;
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}