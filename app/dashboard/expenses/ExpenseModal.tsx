"use client";
import { useState, type FormEvent } from "react";
import { expenseCategories, paymentMethods, type Expense, type ExpenseInput, type ExpenseStatus, type PaymentMethod } from "./expenseTypes";
import { localDateInput } from "./expenseUtils";

export default function ExpenseModal({ expense, saving, onClose, onSave }: {
  expense: Expense | null; saving: boolean; onClose: () => void; onSave: (value: ExpenseInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(expense?.title ?? "");
  const [category, setCategory] = useState(expense?.category ?? "Other");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? "Cash");
  const [date, setDate] = useState(expense?.date?.slice(0, 10) ?? localDateInput());
  const [description, setDescription] = useState(expense?.description ?? "");
  const [status, setStatus] = useState<ExpenseStatus>(expense?.status ?? "Paid");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!title.trim()) return alert("Please enter expense title.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return alert("Please enter a valid amount.");
    await onSave({ title: title.trim(), category, amount: numericAmount, paymentMethod, date, description: description.trim(), status });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5 sm:p-6">
          <div><h2 className="text-xl font-bold">{expense ? "Edit Expense" : "Add Expense"}</h2><p className="mt-1 text-sm text-slate-500">Enter expense information</p></div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-lg bg-slate-100">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <Field label="Expense Title"><input value={title} onChange={e=>setTitle(e.target.value)} className="input" placeholder="e.g. Electricity Bill"/></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><select value={category} onChange={e=>setCategory(e.target.value)} className="input">{expenseCategories.filter(x=>x!=="All").map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Amount"><input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="input"/></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment Method"><select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as PaymentMethod)} className="input">{paymentMethods.map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} className="input"/></Field>
          </div>
          <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value as ExpenseStatus)} className="input"><option>Paid</option><option>Pending</option></select></Field>
          <Field label="Description"><textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} className="input resize-none" placeholder="Optional expense details..."/></Field>
          <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-xl border px-5 py-3 font-bold">Cancel</button>
            <button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? "Saving..." : expense ? "Update Expense" : "Save Expense"}</button>
          </div>
        </form>
      </div>
      <style jsx global>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:.75rem;padding:.75rem 1rem;font-size:.875rem;outline:none}.input:focus{border-color:#3b82f6;box-shadow:0 0 0 2px #dbeafe}`}</style>
    </div>
  );
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <div><label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>{children}</div>}
