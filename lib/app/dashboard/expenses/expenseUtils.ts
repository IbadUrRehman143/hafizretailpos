import type { Expense } from "./expenseTypes";

export function formatPrice(amount: number) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK")}`;
}

export function localDateInput(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function expenseStats(expenses: Expense[]) {
  const today = localDateInput();
  return {
    total: expenses.reduce((s, x) => s + Number(x.amount || 0), 0),
    paid: expenses.filter(x => x.status === "Paid").reduce((s, x) => s + Number(x.amount || 0), 0),
    pending: expenses.filter(x => x.status === "Pending").reduce((s, x) => s + Number(x.amount || 0), 0),
    today: expenses.filter(x => String(x.date).slice(0, 10) === today).reduce((s, x) => s + Number(x.amount || 0), 0),
  };
}
