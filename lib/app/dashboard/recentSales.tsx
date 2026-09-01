type Sale = {
  invoice: string;
  customer: string;
  amount: string;
  status: "Paid" | "Pending";
};

const sales: Sale[] = [
  {
    invoice: "INV-1024",
    customer: "Muhammad Usman",
    amount: "Rs. 12,500",
    status: "Paid",
  },
  {
    invoice: "INV-1023",
    customer: "Ali Khan",
    amount: "Rs. 8,200",
    status: "Paid",
  },
  {
    invoice: "INV-1022",
    customer: "Abdul Rehman",
    amount: "Rs. 5,750",
    status: "Pending",
  },
  {
    invoice: "INV-1021",
    customer: "Hamza Store",
    amount: "Rs. 18,400",
    status: "Paid",
  },
];

export default function RecentSales() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Sales
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest transactions from your store.
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          View All
        </button>
      </div>

      {/* Sales List */}
      <div className="mt-6 divide-y divide-slate-100">
        {sales.map((sale) => (
          <div
            key={sale.invoice}
            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            {/* Customer */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {sale.invoice}
              </p>

              <p className="mt-1 truncate text-xs text-slate-400">
                {sale.customer}
              </p>
            </div>

            {/* Amount + Status */}
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-sm font-semibold text-slate-800">
                {sale.amount}
              </span>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  sale.status === "Paid"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {sale.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}