"use client";

import { useMemo, useState } from "react";

type PaymentMethod = "Cash" | "Bank" | "Credit" | "Other";

type Expense = {
  id: number;
  expenseNo: string;
  title: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  description: string;
  status: "Paid" | "Pending";
};

const initialExpenses: Expense[] = [
  {
    id: 1,
    expenseNo: "EXP-0001",
    title: "Shop Electricity Bill",
    category: "Electricity",
    amount: 12500,
    paymentMethod: "Cash",
    date: "2026-08-25",
    description: "Monthly electricity bill",
    status: "Paid",
  },
  {
    id: 2,
    expenseNo: "EXP-0002",
    title: "Shop Rent",
    category: "Rent",
    amount: 45000,
    paymentMethod: "Bank",
    date: "2026-08-24",
    description: "Monthly shop rent",
    status: "Paid",
  },
  {
    id: 3,
    expenseNo: "EXP-0003",
    title: "Transport",
    category: "Transport",
    amount: 8500,
    paymentMethod: "Cash",
    date: "2026-08-23",
    description: "Goods transportation",
    status: "Paid",
  },
  {
    id: 4,
    expenseNo: "EXP-0004",
    title: "Shop Maintenance",
    category: "Maintenance",
    amount: 6500,
    paymentMethod: "Cash",
    date: "2026-08-22",
    description: "Shop repair and maintenance",
    status: "Pending",
  },
  {
    id: 5,
    expenseNo: "EXP-0005",
    title: "Internet Bill",
    category: "Internet",
    amount: 3500,
    paymentMethod: "Bank",
    date: "2026-08-20",
    description: "Monthly internet bill",
    status: "Paid",
  },
];

const categories = [
  "All",
  "Rent",
  "Electricity",
  "Transport",
  "Maintenance",
  "Internet",
  "Salary",
  "Utilities",
  "Other",
];

const paymentMethods: PaymentMethod[] = [
  "Cash",
  "Bank",
  "Credit",
  "Other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] =
    useState<Expense[]>(initialExpenses);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [selectedExpense, setSelectedExpense] =
    useState<Expense | null>(null);

  const filteredExpenses = useMemo(() => {
    const text = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !text ||
        expense.title
          .toLowerCase()
          .includes(text) ||
        expense.expenseNo
          .toLowerCase()
          .includes(text) ||
        expense.category
          .toLowerCase()
          .includes(text);

      const matchesCategory =
        categoryFilter === "All" ||
        expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  const totalExpenses = expenses.reduce(
    (sum, expense) =>
      sum + expense.amount,
    0
  );

  const paidExpenses = expenses
    .filter(
      (expense) => expense.status === "Paid"
    )
    .reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );

  const pendingExpenses = expenses
    .filter(
      (expense) => expense.status === "Pending"
    )
    .reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );

  const todayExpenses = expenses
    .filter(
      (expense) =>
        expense.date === "2026-08-25"
    )
    .reduce(
      (sum, expense) =>
        sum + expense.amount,
      0
    );

  function formatPrice(amount: number) {
    return `Rs. ${amount.toLocaleString("en-PK")}`;
  }

  function openAddModal() {
    setEditingExpense(null);
    setShowModal(true);
  }

  function openEditModal(expense: Expense) {
    setEditingExpense(expense);
    setShowModal(true);
  }

  function saveExpense(expense: Expense) {
    if (editingExpense) {
      setExpenses((current) =>
        current.map((item) =>
          item.id === expense.id
            ? expense
            : item
        )
      );
    } else {
      setExpenses((current) => [
        expense,
        ...current,
      ]);
    }

    setShowModal(false);
    setEditingExpense(null);
  }

  function deleteExpense(id: number) {
    const expense = expenses.find(
      (item) => item.id === id
    );

    if (!expense) return;

    const confirmed = window.confirm(
      `Delete ${expense.title}?`
    );

    if (!confirmed) return;

    setExpenses((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Expenses
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage and track your business expenses
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95"
          >
            + Add Expense
          </button>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Expenses"
            value={formatPrice(totalExpenses)}
            icon="💰"
          />

          <StatCard
            title="Paid Expenses"
            value={formatPrice(paidExpenses)}
            icon="✅"
          />

          <StatCard
            title="Pending Expenses"
            value={formatPrice(pendingExpenses)}
            icon="⏳"
          />

          <StatCard
            title="Today's Expenses"
            value={formatPrice(todayExpenses)}
            icon="📅"
          />

        </div>

        {/* TABLE CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* FILTERS */}
          <div className="border-b border-slate-200 p-4 sm:p-5">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search expense..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category === "All"
                        ? "All Categories"
                        : category}
                    </option>
                  )
                )}
              </select>

              <div className="flex items-center rounded-xl bg-slate-50 px-4 py-3">

                <span className="text-sm text-slate-500">
                  Showing
                </span>

                <span className="ml-2 font-bold text-slate-900">
                  {filteredExpenses.length}
                </span>

                <span className="ml-1 text-sm text-slate-500">
                  expense
                  {filteredExpenses.length !== 1
                    ? "s"
                    : ""}
                </span>

              </div>

            </div>

          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead>

                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Expense
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Payment
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredExpenses.length === 0 ? (

                  <tr>

                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >

                      <div className="text-4xl">
                        💸
                      </div>

                      <h3 className="mt-3 font-bold text-slate-800">
                        No expenses found
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Try another search or category.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredExpenses.map(
                    (expense) => (

                      <tr
                        key={expense.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* EXPENSE */}
                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-lg">
                              💸
                            </div>

                            <div>

                              <p className="font-bold text-slate-900">
                                {expense.title}
                              </p>

                              <p className="text-xs text-slate-500">
                                {expense.expenseNo}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* CATEGORY */}
                        <td className="px-5 py-4">

                          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            {expense.category}
                          </span>

                        </td>

                        {/* AMOUNT */}
                        <td className="px-5 py-4">

                          <span className="font-bold text-slate-900">
                            {formatPrice(
                              expense.amount
                            )}
                          </span>

                        </td>

                        {/* PAYMENT */}
                        <td className="px-5 py-4">

                          <span className="text-sm font-medium text-slate-700">
                            {expense.paymentMethod}
                          </span>

                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4">

                          <span className="text-sm text-slate-500">
                            {expense.date}
                          </span>

                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              expense.status ===
                              "Paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {expense.status}
                          </span>

                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedExpense(
                                  expense
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  expense
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteExpense(
                                  expense.id
                                )
                              }
                              className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <ExpenseModal
          expense={editingExpense}
          onClose={() => {
            setShowModal(false);
            setEditingExpense(null);
          }}
          onSave={saveExpense}
        />
      )}

      {/* VIEW MODAL */}
      {selectedExpense && (
        <ExpenseViewModal
          expense={selectedExpense}
          onClose={() =>
            setSelectedExpense(null)
          }
        />
      )}

    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADD / EDIT MODAL
===================================================== */

function ExpenseModal({
  expense,
  onClose,
  onSave,
}: {
  expense: Expense | null;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [title, setTitle] = useState(
    expense?.title ?? ""
  );

  const [category, setCategory] =
    useState(
      expense?.category ?? "Other"
    );

  const [amount, setAmount] = useState(
    expense?.amount?.toString() ?? ""
  );

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>(
      expense?.paymentMethod ?? "Cash"
    );

  const [date, setDate] = useState(
    expense?.date ?? "2026-08-25"
  );

  const [description, setDescription] =
    useState(
      expense?.description ?? ""
    );

  const [status, setStatus] =
    useState<"Paid" | "Pending">(
      expense?.status ?? "Paid"
    );

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const numericAmount =
      Number(amount);

    if (!title.trim()) {
      window.alert(
        "Please enter expense title."
      );
      return;
    }

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      window.alert(
        "Please enter a valid amount."
      );
      return;
    }

    const newExpense: Expense = {
      id:
        expense?.id ??
        Date.now(),

      expenseNo:
        expense?.expenseNo ??
        `EXP-${String(
          Date.now()
        ).slice(-4)}`,

      title: title.trim(),

      category,

      amount: numericAmount,

      paymentMethod,

      date,

      description:
        description.trim(),

      status,
    };

    onSave(newExpense);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 sm:p-6">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              {expense
                ? "Edit Expense"
                : "Add Expense"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter expense information
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ✕
          </button>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-6"
        >

          {/* TITLE */}
          <div>

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Expense Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Electricity Bill"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* CATEGORY + AMOUNT */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >

                {categories
                  .filter(
                    (item) =>
                      item !== "All"
                  )
                  .map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Amount
              </label>

              <input
                type="number"
                min="0"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          {/* PAYMENT + DATE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target
                      .value as PaymentMethod
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >

                {paymentMethods.map(
                  (method) => (
                    <option
                      key={method}
                      value={method}
                    >
                      {method}
                    </option>
                  )
                )}

              </select>

            </div>

            <div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />

            </div>

          </div>

          {/* STATUS */}
          <div>

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | "Paid"
                    | "Pending"
                )
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
            >

              <option value="Paid">
                Paid
              </option>

              <option value="Pending">
                Pending
              </option>

            </select>

          </div>

          {/* DESCRIPTION */}
          <div>

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Description
            </label>

            <textarea
              rows={4}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Optional expense details..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* BUTTONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              {expense
                ? "Update Expense"
                : "Save Expense"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =====================================================
   VIEW MODAL
===================================================== */

function ExpenseViewModal({
  expense,
  onClose,
}: {
  expense: Expense;
  onClose: () => void;
}) {
  function formatPrice(amount: number) {
    return `Rs. ${amount.toLocaleString(
      "en-PK"
    )}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Expense Details
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {expense.expenseNo}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            ✕
          </button>

        </div>

        {/* CONTENT */}
        <div className="space-y-4 p-5">

          <DetailRow
            label="Expense"
            value={expense.title}
          />

          <DetailRow
            label="Category"
            value={expense.category}
          />

          <DetailRow
            label="Amount"
            value={formatPrice(
              expense.amount
            )}
          />

          <DetailRow
            label="Payment Method"
            value={
              expense.paymentMethod
            }
          />

          <DetailRow
            label="Date"
            value={expense.date}
          />

          <div className="flex items-center justify-between border-b border-slate-100 pb-4">

            <span className="text-sm text-slate-500">
              Status
            </span>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                expense.status ===
                "Paid"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {expense.status}
            </span>

          </div>

          {expense.description && (
            <div>

              <p className="text-xs font-bold uppercase text-slate-400">
                Description
              </p>

              <p className="mt-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {expense.description}
              </p>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-200 p-5">

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   DETAIL ROW
===================================================== */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-bold text-slate-900">
        {value}
      </span>

    </div>
  );
}