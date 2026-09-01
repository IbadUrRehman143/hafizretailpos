import { formatPrice } from "./expenseUtils";

export default function ExpenseStats({ stats }: { stats: { total: number; paid: number; pending: number; today: number } }) {
  const cards = [
    ["Total Expenses", stats.total, "💰"],
    ["Paid Expenses", stats.paid, "✅"],
    ["Pending Expenses", stats.pending, "⏳"],
    ["Today's Expenses", stats.today, "📅"],
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([title, value, icon]) => (
        <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-xl font-bold text-slate-900">{formatPrice(value)}</p></div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">{icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
