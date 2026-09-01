export default function InventoryStats({
  totalItems,
  inStock,
  lowStock,
  outOfStock,
}: {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}) {
  const cards = [
    { label: "Total Products", value: totalItems },
    { label: "In Stock", value: inStock },
    { label: "Low Stock", value: lowStock },
    { label: "Out of Stock", value: outOfStock },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
