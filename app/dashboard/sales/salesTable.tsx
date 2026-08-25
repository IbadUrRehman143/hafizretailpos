"use client";

import {
  Sale,
  SaleStatus,
} from "./page";

type Props = {
  sales: Sale[];

  search: string;
  setSearch: (
    value: string
  ) => void;

  statusFilter: string;
  setStatusFilter: (
    value: string
  ) => void;

  onView: (
    sale: Sale
  ) => void;

  onEdit: (
    sale: Sale
  ) => void;

  onDelete: (
    id: number
  ) => void;
};

export default function SalesTable({
  sales,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const filteredSales =
    sales.filter((sale) => {

      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        sale.invoiceNo
          .toLowerCase()
          .includes(searchValue) ||
        sale.customerName
          .toLowerCase()
          .includes(searchValue) ||
        sale.customerPhone
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        sale.status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  return (
    <div className="space-y-4">

      {/* SEARCH */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-[1fr_200px]">

          <div className="relative">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              🔎
            </span>

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search invoice, customer or phone..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
            />

          </div>

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
          >

            <option value="All">
              All Status
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Partial">
              Partial
            </option>

            <option value="Unpaid">
              Unpaid
            </option>

          </select>

        </div>

      </div>

      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-300">

            <thead className="border-b bg-slate-50">

              <tr>

                <Head>
                  Invoice
                </Head>

                <Head>
                  Date
                </Head>

                <Head>
                  Customer
                </Head>

                <Head>
                  Product
                </Head>

                <Head>
                  Qty
                </Head>

                <Head>
                  Total
                </Head>

                <Head>
                  Paid
                </Head>

                <Head>
                  Receivable
                </Head>

                <Head>
                  Payment
                </Head>

                <Head>
                  Status
                </Head>

                <Head>
                  Actions
                </Head>

              </tr>

            </thead>

            <tbody className="divide-y">

              {filteredSales.length ===
              0 ? (

                <tr>

                  <td
                    colSpan={11}
                    className="p-10 text-center text-sm text-slate-500"
                  >
                    No sales found.
                  </td>

                </tr>

              ) : (

                filteredSales.map(
                  (sale) => {

                    const item =
                      sale.items[0];

                    return (
                      <tr
                        key={
                          sale.id
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold">
                            {
                              sale.invoiceNo
                            }
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {sale.date}
                        </td>

                        <td className="px-5 py-4">

                          <p className="font-semibold">
                            {
                              sale.customerName
                            }
                          </p>

                          {sale.customerPhone && (
                            <p className="text-xs text-slate-500">
                              {
                                sale.customerPhone
                              }
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-4 text-sm">
                          {
                            item.productName
                          }
                        </td>

                        <td className="px-5 py-4">

                          <span className="font-semibold">
                            {
                              item.quantity
                            }
                          </span>

                          <span className="ml-1 text-xs text-slate-500">
                            {
                              item.unit
                            }
                          </span>

                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {currency(
                            sale.grandTotal
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-green-600">
                          {currency(
                            sale.paidAmount
                          )}
                        </td>

                        <td className="px-5 py-4 font-semibold text-red-600">
                          {currency(
                            sale.remainingAmount
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {
                            sale.paymentMethod
                          }
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={
                              sale.status
                            }
                          />

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                onView(
                                  sale
                                )
                              }
                              className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              View
                            </button>

                            <button
                              onClick={() =>
                                onEdit(
                                  sale
                                )
                              }
                              className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                onDelete(
                                  sale.id
                                )
                              }
                              className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function currency(
  value: number
) {
  return `Rs. ${value.toLocaleString()}`;
}

function Head({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function StatusBadge({
  status,
}: {
  status: SaleStatus;
}) {
  const styles = {
    Paid: "bg-green-50 text-green-700",
    Partial:
      "bg-orange-50 text-orange-700",
    Unpaid:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}