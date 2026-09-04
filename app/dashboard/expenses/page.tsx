"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import ExpenseModal from "./ExpenseModal";
import ExpenseStats from "./ExpenseStats";
import ExpenseViewModal from "./ExpenseViewModal";
import {
  expenseCategories,
  type Expense,
  type ExpenseInput,
} from "./expenseTypes";
import {
  expenseStats,
  formatPrice,
} from "./expenseUtils";

export default function ExpensesPage() {
  const router = useRouter();

  const [expenses, setExpenses] =
    useState<Expense[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<Expense | null>(
    null
  );

  const [
    selected,
    setSelected,
  ] = useState<Expense | null>(
    null
  );

  const load = useCallback(
    async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/expenses",
            {
              cache: "no-store",
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          return;
        }

        setExpenses(
          Array.isArray(
            data.expenses
          )
            ? data.expenses
            : []
        );
      } catch {
        // Silent fail:
        // no browser alert or console overlay.
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const filtered =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return expenses.filter(
        (expense) =>
          (
            !text ||
            expense.title
              .toLowerCase()
              .includes(text) ||
            expense.expenseNo
              .toLowerCase()
              .includes(text) ||
            expense.category
              .toLowerCase()
              .includes(text)
          ) &&
          (
            categoryFilter ===
              "All" ||
            expense.category ===
              categoryFilter
          )
      );
    }, [
      expenses,
      search,
      categoryFilter,
    ]);

  const stats =
    useMemo(
      () =>
        expenseStats(
          expenses
        ),
      [expenses]
    );

  async function save(
    input: ExpenseInput
  ) {
    try {
      setSaving(true);

      const response =
        await fetch(
          editing
            ? `/api/expenses/${editing.id}`
            : "/api/expenses",
          {
            method:
              editing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                input
              ),
          }
        );

      if (!response.ok) {
        return;
      }

      await load();

      setShowModal(
        false
      );

      setEditing(
        null
      );
    } catch {
      // Silent fail:
      // no browser alert or console overlay.
    } finally {
      setSaving(false);
    }
  }

  async function remove(
    expense: Expense
  ) {
    try {
      const response =
        await fetch(
          `/api/expenses/${expense.id}`,
          {
            method:
              "DELETE",
          }
        );

      if (response.ok) {
        if (
          selected?.id ===
          expense.id
        ) {
          setSelected(null);
        }

        await load();
        return;
      }

      /*
        No browser popup is shown.

        If your API later supports archive/inactive
        for expenses, that fallback can be added here.
        For now, failed deletes simply leave the record
        unchanged instead of showing an alert.
      */
    } catch {
      // Silent fail.
    }
  }

  function openAddExpense() {
    setEditing(null);
    setShowModal(true);
  }

  function closeExpenseModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Expenses
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage and track
                your business
                expenses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              openAddExpense
            }
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            + Add Expense
          </button>
        </div>

        {/* STATS */}

        <ExpenseStats
          stats={stats}
        />

        {/* FILTERS + LIST */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search expense..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />

            <select
              value={
                categoryFilter
              }
              onChange={(
                event
              ) =>
                setCategoryFilter(
                  event.target
                    .value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {expenseCategories.map(
                (
                  category
                ) => (
                  <option
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {category ===
                    "All"
                      ? "All Categories"
                      : category}
                  </option>
                )
              )}
            </select>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Showing{" "}
              <b className="text-slate-900">
                {
                  filtered.length
                }
              </b>{" "}
              expenses
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : filtered.length ===
            0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No expenses found.
            </div>
          ) : (
            <>
              {/* MOBILE / TABLET CARDS */}

              <div className="divide-y divide-slate-100 lg:hidden">
                {filtered.map(
                  (expense) => (
                    <div
                      key={
                        expense.id
                      }
                      className="p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {
                              expense.title
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              expense.expenseNo
                            }
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            expense.status ===
                            "Paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {
                            expense.status
                          }
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Category
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {
                              expense.category
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Payment
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {
                              expense.paymentMethod
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Amount
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {formatPrice(
                              expense.amount
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">
                            Date
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {expense.date
                              .slice(
                                0,
                                10
                              )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelected(
                              expense
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditing(
                              expense
                            );
                            setShowModal(
                              true
                            );
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void remove(
                              expense
                            )
                          }
                          className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-237.5">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      {[
                        "Expense",
                        "Category",
                        "Amount",
                        "Payment",
                        "Date",
                        "Status",
                        "Actions",
                      ].map(
                        (
                          heading
                        ) => (
                          <th
                            key={
                              heading
                            }
                            className="px-5 py-4"
                          >
                            {
                              heading
                            }
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map(
                      (
                        expense
                      ) => (
                        <tr
                          key={
                            expense.id
                          }
                          className="border-t border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <b className="text-slate-900">
                              {
                                expense.title
                              }
                            </b>

                            <div className="text-xs text-slate-500">
                              {
                                expense.expenseNo
                              }
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {
                              expense.category
                            }
                          </td>

                          <td className="px-5 py-4 font-bold text-slate-900">
                            {formatPrice(
                              expense.amount
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {
                              expense.paymentMethod
                            }
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {expense.date
                              .slice(
                                0,
                                10
                              )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                expense.status ===
                                "Paid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {
                                expense.status
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelected(
                                    expense
                                  )
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                              >
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(
                                    expense
                                  );
                                  setShowModal(
                                    true
                                  );
                                }}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void remove(
                                    expense
                                  )
                                }
                                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <ExpenseModal
          expense={editing}
          saving={saving}
          onClose={
            closeExpenseModal
          }
          onSave={save}
        />
      )}

      {selected && (
        <ExpenseViewModal
          expense={selected}
          onClose={() =>
            setSelected(
              null
            )
          }
        />
      )}
    </div>
  );
}
