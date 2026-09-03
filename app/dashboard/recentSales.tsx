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
    <section className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Recent Sales
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Latest transactions from your store.
          </p>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 sm:px-3 sm:text-sm"
        >
          View All
        </button>
      </div>

      {/* Sales List */}
      <div className="mt-4 divide-y divide-slate-100 sm:mt-5 lg:mt-6">
        {sales.map((sale) => (
          <div
            key={sale.invoice}
            className="flex min-w-0 items-center justify-between gap-2.5 py-3.5 first:pt-0 last:pb-0 sm:gap-4 sm:py-4"
          >
            {/* Customer */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 sm:text-[15px]">
                {sale.invoice}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:mt-1 sm:text-xs">
                {sale.customer}
              </p>
            </div>

            {/* Amount + Status */}
            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <span className="whitespace-nowrap text-xs font-semibold text-slate-800 sm:text-sm">
                {sale.amount}
              </span>

              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${
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