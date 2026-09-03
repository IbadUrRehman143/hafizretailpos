type StockItem = {
  name: string;
  category: string;
  quantity: number;
};

const stockItems: StockItem[] = [
  {
    name: "Washing Machine",
    category: "Electronics",
    quantity: 3,
  },
  {
    name: "Cotton Roll",
    category: "Bedding",
    quantity: 1,
  },
  {
    name: "Charpai Rope",
    category: "Charpai",
    quantity: 5,
  },
  {
    name: "Air Cooler",
    category: "Electronics",
    quantity: 2,
  },
];

function getStockStyle(quantity: number) {
  if (quantity <= 1) {
    return "bg-red-50 text-red-600";
  }

  return "bg-amber-50 text-amber-600";
}

export default function LowStock() {
  return (
    <section className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Low Stock
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Products that need restocking.
          </p>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 sm:px-3 sm:text-sm"
        >
          View All
        </button>
      </div>

      {/* Stock List */}
      <div className="mt-4 divide-y divide-slate-100 sm:mt-5 lg:mt-6">
        {stockItems.map((item) => (
          <div
            key={item.name}
            className="flex min-w-0 items-center justify-between gap-2.5 py-3.5 first:pt-0 last:pb-0 sm:gap-4 sm:py-4"
          >
            {/* Product */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 sm:text-[15px]">
                {item.name}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:mt-1 sm:text-xs">
                {item.category}
              </p>
            </div>

            {/* Quantity */}
            <span
              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${getStockStyle(
                item.quantity
              )}`}
            >
              {item.quantity} left
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}