export type PaymentMethod = "Cash" | "Bank" | "Credit" | "Other";
export type ExpenseStatus = "Paid" | "Pending";

export type Expense = {
  id: number;
  expenseNo: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  description: string;
  status: ExpenseStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpenseInput = Omit<Expense, "id" | "expenseNo" | "createdAt" | "updatedAt">;

export const expenseCategories = [
  "All", "Rent", "Electricity", "Transport", "Maintenance",
  "Internet", "Salary", "Utilities", "Other",
];

export const paymentMethods: PaymentMethod[] = ["Cash", "Bank", "Credit", "Other"];
