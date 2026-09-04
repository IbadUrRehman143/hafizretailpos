"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import ReturnModal from "./ReturnModal";
import type { ReturnRecord, ReturnStatus } from "./returnTypes";
import { money, statusClass } from "./returnUtils";

export default function ReturnsPage() {
  const router = useRouter();

  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | ReturnStatus>("All");
  const [editing, setEditing] = useState<ReturnRecord | null>(null);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState<ReturnRecord | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/returns", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      setReturns(
        Array.isArray(data.returns)
          ? data.returns
          : []
      );
    } catch {
      // Silent fail:
      // no browser alert / console overlay.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const text = search.toLowerCase().trim();

    return returns.filter((item) => {
      const matchesSearch =
        !text ||
        item.returnNo.toLowerCase().includes(text) ||
        item.invoiceNo.toLowerCase().includes(text) ||
        item.customerName.toLowerCase().includes(text) ||
        item.items.some((returnItem) =>
          returnItem.productName.toLowerCase().includes(text)
        );

      const matchesStatus =
        status === "All" ||
        item.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [returns, search, status]);

  const stats = {
    total: returns.length,
    completed: returns.filter(
      (item) => item.status === "Completed"
    ).length,
    pending: returns.filter(
      (item) => item.status === "Pending"
    ).length,
    refunds: returns.reduce(
      (sum, item) => sum + item.refundAmount,
      0
    ),
  };

  async function remove(record: ReturnRecord) {
    try {
      const response = await fetch(
        `/api/returns/${record.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        return;
      }

      if (selected?.id === record.id) {
        setSelected(null);
      }

      await load();
    } catch {
      // Silent fail.
    }
  }

  function openNewReturn() {
    setEditing(null);
    setShow(true);
  }

  function closeReturnModal() {
    setShow(false);
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Back to Dashboard"
              title="Back to Dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Returns
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Invoice-based returns, refunds and stock restoration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openNewReturn}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 sm:w-auto"
          >
            + New Return
          </button>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {[
            ["Total Returns", stats.total],
            ["Completed", stats.completed],
            ["Pending", stats.pending],
            ["Total Refunds", money(stats.refunds)],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">
                {label}
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* FILTERS */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search return, invoice, customer, product..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "All" | ReturnStatus)
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
            >
              {[
                "All",
                "Pending",
                "Approved",
                "Completed",
                "Rejected",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Showing{" "}
              <b className="text-slate-900">
                {filtered.length}
              </b>{" "}
              returns
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No returns found.
            </div>
          ) : (
            <>
              {/* MOBILE / TABLET / SMALL DESKTOP CARDS */}

              <div className="divide-y divide-slate-100 xl:hidden">
                {filtered.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                          {record.returnNo}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(record.date).toLocaleString("en-PK")}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          Invoice
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {record.invoiceNo}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          Customer
                        </p>

                        <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-700">
                          {record.customerName}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-400">
                          Total Amount
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {money(record.totalAmount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 p-3">
                        <p className="text-xs text-emerald-600">
                          Refund
                        </p>

                        <p className="mt-1 text-sm font-bold text-emerald-700">
                          {money(record.refundAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Product
                      </p>

                      <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-700">
                        {record.items
                          .map((item) => item.productName)
                          .join(", ")}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(record)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditing(record);
                          setShow(true);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void remove(record)}
                        className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE - NO HORIZONTAL SCROLL */}

              <div className="hidden xl:block">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[11%]" />
                    <col className="w-[15%]" />
                    <col className="w-[18%]" />
                    <col className="w-[11%]" />
                    <col className="w-[11%]" />
                    <col className="w-[10%]" />
                    <col className="w-[12%]" />
                  </colgroup>

                  <thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500">
                    <tr>
                      {[
                        "Return",
                        "Invoice",
                        "Customer",
                        "Product",
                        "Amount",
                        "Refund",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-2.5 py-4 font-bold tracking-wide"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-2.5 py-4 align-top">
                          <p className="wrap-break-word text-[13px] font-bold text-slate-900">
                            {record.returnNo}
                          </p>

                          <p className="mt-1 text-[11px] leading-tight text-slate-500">
                            {new Date(record.date).toLocaleString("en-PK")}
                          </p>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] text-slate-700">
                          <span className="wrap-break-word">
                            {record.invoiceNo}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] text-slate-700">
                          <span className="wrap-break-word">
                            {record.customerName}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] text-slate-700">
                          <span className="wrap-break-word">
                            {record.items
                              .map((item) => item.productName)
                              .join(", ")}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-bold text-slate-900">
                          {money(record.totalAmount)}
                        </td>

                        <td className="px-2.5 py-4 align-top text-[13px] font-bold text-emerald-700">
                          {money(record.refundAmount)}
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>

                        <td className="px-2.5 py-4 align-top">
                          <div className="grid gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelected(record)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditing(record);
                                setShow(true);
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => void remove(record)}
                              className="w-full rounded-lg bg-red-50 px-2 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {show && (
        <ReturnModal
          record={editing}
          onClose={closeReturnModal}
          onSaved={load}
        />
      )}

      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-3 sm:flex sm:items-center sm:justify-center sm:p-4">
          <div className="mx-auto my-4 w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:my-0 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="wrap-break-word text-xl font-bold text-slate-900">
                  {selected.returnNo}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Return details
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                  selected.status
                )}`}
              >
                {selected.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">
                  Invoice
                </p>

                <p className="mt-1 wrap-break-word font-semibold text-slate-800">
                  {selected.invoiceNo}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">
                  Customer
                </p>

                <p className="mt-1 wrap-break-word font-semibold text-slate-800">
                  {selected.customerName}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400">
                  Amount
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {money(selected.totalAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600">
                  Refund
                </p>

                <p className="mt-1 font-bold text-emerald-700">
                  {money(selected.refundAmount)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-400">
                Reason
              </p>

              <p className="mt-1 wrap-break-word text-sm text-slate-700">
                {selected.reason || "No reason"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-xl bg-slate-900 p-3 font-bold text-white transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
