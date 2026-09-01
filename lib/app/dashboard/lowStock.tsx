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
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Low Stock
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Products that need restocking.
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          View All
        </button>
      </div>

      {/* Stock List */}
      <div className="mt-6 divide-y divide-slate-100">
        {stockItems.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
          >
            {/* Product */}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {item.name}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {item.category}
              </p>
            </div>

            {/* Quantity */}
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStockStyle(
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