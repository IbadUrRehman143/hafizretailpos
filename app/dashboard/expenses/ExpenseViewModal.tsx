import type { Expense } from "./expenseTypes";
import { formatPrice } from "./expenseUtils";

export default function ExpenseViewModal({ expense, onClose }: { expense: Expense; onClose: () => void }) {
  const rows = [["Expense",expense.title],["Category",expense.category],["Amount",formatPrice(expense.amount)],["Payment Method",expense.paymentMethod],["Date",expense.date.slice(0,10)],["Status",expense.status]];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-bold">Expense Details</h2><p className="mt-1 text-xs text-slate-500">{expense.expenseNo}</p></div><button onClick={onClose} className="h-9 w-9 rounded-lg bg-slate-100">✕</button></div>
    <div className="space-y-4 p-5">{rows.map(([a,b])=><div key={a} className="flex justify-between border-b pb-4"><span className="text-sm text-slate-500">{a}</span><span className="text-right text-sm font-bold">{b}</span></div>)}{expense.description&&<div><p className="text-xs font-bold uppercase text-slate-400">Description</p><p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm">{expense.description}</p></div>}</div>
    <div className="border-t p-5"><button onClick={onClose} className="w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Close</button></div>
  </div></div>
}
