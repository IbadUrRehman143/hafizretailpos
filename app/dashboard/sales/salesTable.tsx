"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import type {
  Sale,
  SaleStatus,
} from "./page";

/* =====================================================
   TYPES
===================================================== */

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

/* =====================================================
   SALES TABLE
===================================================== */

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
  /* =================================================
     FILTER
  ================================================= */

  const searchValue =
    search
      .trim()
      .toLowerCase();

  const filteredSales =
    useMemo(
      () =>
        sales.filter(
          (sale) => {
            const matchesSearch =
              sale.invoiceNo
                .toLowerCase()
                .includes(
                  searchValue
                ) ||
              sale.customerName
                .toLowerCase()
                .includes(
                  searchValue
                ) ||
              sale.customerPhone
                .toLowerCase()
                .includes(
                  searchValue
                ) ||
              sale.items.some(
                (item) =>
                  item.productName
                    .toLowerCase()
                    .includes(
                      searchValue
                    )
              );

            const matchesStatus =
              statusFilter ===
                "All" ||
              sale.status ===
                statusFilter;

            return (
              matchesSearch &&
              matchesStatus
            );
          }
        ),
      [
        sales,
        searchValue,
        statusFilter,
      ]
    );

  const ITEMS_PER_PAGE = 10;

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredSales.length /
          ITEMS_PER_PAGE
      )
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);

  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  const paginatedSales =
    useMemo(
      () => {
        const startIndex =
          (currentPage - 1) *
          ITEMS_PER_PAGE;

        return filteredSales.slice(
          startIndex,
          startIndex +
            ITEMS_PER_PAGE
        );
      },
      [
        filteredSales,
        currentPage,
      ]
    );

  const startSaleNumber =
    filteredSales.length ===
    0
      ? 0
      : (currentPage - 1) *
          ITEMS_PER_PAGE +
        1;

  const endSaleNumber =
    Math.min(
      currentPage *
        ITEMS_PER_PAGE,
      filteredSales.length
    );

  return (
    <div className="w-full min-w-0 space-y-4">

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">

          {/* SEARCH */}

          <div className="relative min-w-0">

            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              🔎
            </span>

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search invoice, customer or phone..."
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
            />

          </div>

          {/* STATUS FILTER */}

          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
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

        {/* RESULT COUNT */}

        <div className="mt-3">

          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {
                filteredSales.length
              }
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {
                sales.length
              }
            </span>{" "}
            sales
          </p>

        </div>

      </div>

      {/* =================================================
          MOBILE SALES LIST
      ================================================= */}

      <div className="space-y-3 lg:hidden">

        {filteredSales.length ===
        0 ? (

          <EmptySales />

        ) : (

          paginatedSales.map(
            (sale) => {
              const firstItem =
                sale.items[0];

              const moreItems =
                Math.max(
                  sale.items.length -
                    1,
                  0
                );

              return (
                <div
                  key={
                    sale.id
                  }
                  className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* TOP */}

                  <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 p-3.5">

                    <div className="min-w-0">

                      <button
                        type="button"
                        onClick={() =>
                          onView(
                            sale
                          )
                        }
                        className="inline-flex max-w-full rounded-lg bg-slate-100 px-2.5 py-1 text-left text-xs font-bold text-slate-900"
                      >
                        <span className="truncate">
                          {
                            sale.invoiceNo
                          }
                        </span>
                      </button>

                      <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                        {
                          sale.date
                        }
                      </p>

                    </div>

                    <div className="shrink-0">

                      <StatusBadge
                        status={
                          sale.status
                        }
                      />

                    </div>

                  </div>

                  {/* CUSTOMER */}

                  <div className="border-b border-slate-100 px-3.5 py-3">

                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Customer
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-slate-900">
                      {
                        sale.customerName
                      }
                    </p>

                    {sale.customerPhone && (

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {
                          sale.customerPhone
                        }
                      </p>

                    )}

                  </div>

                  {/* PRODUCT */}

                  <div className="border-b border-slate-100 px-3.5 py-3">

                    <div className="flex min-w-0 items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Product
                        </p>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                          {firstItem
                            ? firstItem.productName
                            : "-"}
                        </p>

                        {moreItems >
                          0 && (

                          <p className="mt-1 text-xs font-medium text-blue-600">
                            +
                            {
                              moreItems
                            }{" "}
                            more
                          </p>

                        )}

                      </div>

                      <div className="shrink-0 text-right">

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Qty
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">

                          {firstItem ? (
                            <>
                              {
                                firstItem.quantity
                              }

                              <span className="ml-1 text-xs font-medium text-slate-500">
                                {
                                  firstItem.unit
                                }
                              </span>
                            </>
                          ) : (
                            "-"
                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                  {/* AMOUNTS */}

                  <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">

                    <MobileAmountCard
                      label="Total"
                      value={
                        currency(
                          sale.grandTotal
                        )
                      }
                    />

                    <MobileAmountCard
                      label="Paid"
                      value={
                        currency(
                          sale.paidAmount
                        )
                      }
                      valueClassName="text-emerald-600"
                    />

                    <MobileAmountCard
                      label="Receivable"
                      value={
                        currency(
                          sale.remainingAmount
                        )
                      }
                      valueClassName={
                        sale.remainingAmount >
                        0
                          ? "text-red-600"
                          : "text-slate-700"
                      }
                    />

                    <MobileAmountCard
                      label="Profit"
                      value={
                        currency(
                          sale.profitAmount
                        )
                      }
                      valueClassName={
                        sale.profitAmount >=
                        0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    />

                    <MobileAmountCard
                      label="Margin"
                      value={`${sale.profitMargin.toFixed(
                        1
                      )}%`}
                      valueClassName={
                        sale.profitMargin >=
                        0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    />

                    <MobileAmountCard
                      label="Payment"
                      value={
                        sale.paymentMethod
                      }
                    />

                  </div>

                  {/* ACTIONS */}

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-3">

                    <button
                      type="button"
                      onClick={() =>
                        onView(
                          sale
                        )
                      }
                      className="flex min-h-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          sale
                        )
                      }
                      className="flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onDelete(
                          sale.id
                        )
                      }
                      className="flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              );
            }
          )

        )}

      </div>

      {/* =================================================
          LAPTOP / DESKTOP TABLE
      ================================================= */}

      <div className="hidden w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">

        {filteredSales.length ===
        0 ? (

          <EmptySales />

        ) : (

          <div className="w-full min-w-0 overflow-x-hidden">

            <table className="w-full table-fixed">

              <thead className="border-b border-slate-200 bg-slate-50">

                <tr>

                  {/* ALWAYS */}

                  <Head className="w-[10%]">
                    Invoice
                  </Head>

                  {/* XL */}

                  <Head className="hidden w-[11%] xl:table-cell">
                    Date
                  </Head>

                  {/* ALWAYS */}

                  <Head className="w-[15%]">
                    Customer
                  </Head>

                  {/* XL */}

                  <Head className="hidden w-[14%] xl:table-cell">
                    Product
                  </Head>

                  {/* ALWAYS */}

                  <Head className="w-[7%] text-center">
                    Qty
                  </Head>

                  <Head className="w-[11%] text-right">
                    Total
                  </Head>

                  <Head className="w-[11%] text-right">
                    Paid
                  </Head>

                  <Head className="w-[12%] text-right">
                    Receivable
                  </Head>

                  {/* XL */}

                  <Head className="hidden w-[12%] text-right xl:table-cell">
                    Profit
                  </Head>

                  {/* 2XL */}

                  <Head className="hidden w-[9%] text-center 2xl:table-cell">
                    Margin
                  </Head>

                  {/* ALWAYS */}

                  <Head className="w-[13%] text-center">
                    Status
                  </Head>

                  <Head className="w-[21%] text-right">
                    Actions
                  </Head>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {paginatedSales.map(
                  (sale) => {
                    const firstItem =
                      sale.items[0];

                    return (
                      <tr
                        key={
                          sale.id
                        }
                        className="transition hover:bg-slate-50"
                      >

                        {/* INVOICE */}

                        <td className="overflow-hidden px-2 py-4 sm:px-3">

                          <button
                            type="button"
                            onClick={() =>
                              onView(
                                sale
                              )
                            }
                            className="block max-w-full truncate rounded-lg bg-slate-100 px-2 py-1 text-left text-xs font-bold text-slate-900"
                            title={
                              sale.invoiceNo
                            }
                          >
                            {
                              sale.invoiceNo
                            }
                          </button>

                        </td>

                        {/* DATE */}

                        <td className="hidden overflow-hidden px-3 py-4 xl:table-cell">

                          <p
                            className="line-clamp-2 text-xs leading-5 text-slate-500"
                            title={
                              sale.date
                            }
                          >
                            {
                              sale.date
                            }
                          </p>

                        </td>

                        {/* CUSTOMER */}

                        <td className="overflow-hidden px-2 py-4 sm:px-3">

                          <p
                            className="truncate text-sm font-semibold text-slate-900"
                            title={
                              sale.customerName
                            }
                          >
                            {
                              sale.customerName
                            }
                          </p>

                          {sale.customerPhone && (

                            <p
                              className="mt-1 truncate text-[11px] text-slate-500"
                              title={
                                sale.customerPhone
                              }
                            >
                              {
                                sale.customerPhone
                              }
                            </p>

                          )}

                        </td>

                        {/* PRODUCT */}

                        <td className="hidden overflow-hidden px-3 py-4 xl:table-cell">

                          <p
                            className="truncate text-sm text-slate-700"
                            title={
                              firstItem?.productName ||
                              ""
                            }
                          >
                            {firstItem
                              ? firstItem.productName
                              : "-"}
                          </p>

                          {sale.items.length >
                            1 && (

                            <p className="mt-1 text-xs text-blue-500">
                              +
                              {sale.items.length -
                                1}{" "}
                              more
                            </p>

                          )}

                        </td>

                        {/* QTY */}

                        <td className="overflow-hidden px-2 py-4 text-center">

                          {firstItem ? (

                            <div className="flex flex-col items-center">

                              <span className="text-sm font-bold text-slate-900">
                                {
                                  firstItem.quantity
                                }
                              </span>

                              <span className="text-[10px] font-medium text-slate-500">
                                {
                                  firstItem.unit
                                }
                              </span>

                            </div>

                          ) : (
                            "-"
                          )}

                        </td>

                        {/* TOTAL */}

                        <td className="overflow-hidden px-2 py-4 text-right sm:px-3">

                          <p
                            className="truncate text-xs font-bold text-slate-900 xl:text-sm"
                            title={
                              currency(
                                sale.grandTotal
                              )
                            }
                          >
                            {currencyShort(
                              sale.grandTotal
                            )}
                          </p>

                        </td>

                        {/* PAID */}

                        <td className="overflow-hidden px-2 py-4 text-right sm:px-3">

                          <p
                            className="truncate text-xs font-bold text-emerald-600 xl:text-sm"
                            title={
                              currency(
                                sale.paidAmount
                              )
                            }
                          >
                            {currencyShort(
                              sale.paidAmount
                            )}
                          </p>

                        </td>

                        {/* RECEIVABLE */}

                        <td className="overflow-hidden px-2 py-4 text-right sm:px-3">

                          <p
                            className={`truncate text-xs font-bold xl:text-sm ${
                              sale.remainingAmount >
                              0
                                ? "text-red-600"
                                : "text-slate-600"
                            }`}
                            title={
                              currency(
                                sale.remainingAmount
                              )
                            }
                          >
                            {currencyShort(
                              sale.remainingAmount
                            )}
                          </p>

                        </td>

                        {/* PROFIT */}

                        <td className="hidden overflow-hidden px-3 py-4 text-right xl:table-cell">

                          <p
                            className={`truncate text-sm font-bold ${
                              sale.profitAmount >=
                              0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                            title={
                              currency(
                                sale.profitAmount
                              )
                            }
                          >
                            {currencyShort(
                              sale.profitAmount
                            )}
                          </p>

                        </td>

                        {/* MARGIN */}

                        <td className="hidden px-2 py-4 text-center 2xl:table-cell">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              sale.profitMargin >=
                              0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {sale.profitMargin.toFixed(
                              1
                            )}
                            %
                          </span>

                        </td>

                        {/* STATUS */}

                        <td className="whitespace-nowrap px-3 py-4 text-center">

                          <StatusBadge
                            status={
                              sale.status
                            }
                          />

                        </td>

                        {/* ACTIONS */}

                        <td className="whitespace-nowrap px-3 py-4">

                          <div className="flex min-w-max items-center justify-end gap-1.5">

                            <button
                              type="button"
                              onClick={() =>
                                onView(
                                  sale
                                )
                              }
                              className="rounded-lg border border-blue-100 px-2 py-2 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50 xl:px-2.5"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onEdit(
                                  sale
                                )
                              }
                              className="rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 xl:px-2.5"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onDelete(
                                  sale.id
                                )
                              }
                              className="hidden rounded-lg border border-red-100 px-2 py-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 xl:block"
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* =================================================
          PAGINATION
      ================================================= */}

      {filteredSales.length >
        0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">

          <p className="text-center text-xs text-slate-500 sm:text-left">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {startSaleNumber}
            </span>
            {" - "}
            <span className="font-semibold text-slate-700">
              {endSaleNumber}
            </span>
            {" of "}
            <span className="font-semibold text-slate-700">
              {filteredSales.length}
            </span>
            {" sales"}
          </p>

          <div className="flex items-center justify-center gap-2">

            <button
              type="button"
              disabled={
                currentPage ===
                1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="min-w-24 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-700">
              Page{" "}
              {currentPage}
              {" / "}
              {totalPages}
            </div>

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

/* =====================================================
   MOBILE AMOUNT CARD
===================================================== */

function MobileAmountCard({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;

  value: string;

  valueClassName?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">

      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-bold ${valueClassName}`}
      >
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   EMPTY SALES
===================================================== */

function EmptySales() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">

      <p className="text-sm font-semibold text-slate-700">
        No sales found.
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Try changing your search
        or status filter.
      </p>

    </div>
  );
}

/* =====================================================
   CURRENCY
===================================================== */

function currency(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =====================================================
   SHORT LAPTOP CURRENCY
===================================================== */

function currencyShort(
  value: number
) {
  return `Rs. ${Number(
    value || 0
  ).toLocaleString(
    "en-PK",
    {
      maximumFractionDigits:
        0,
    }
  )}`;
}

/* =====================================================
   TABLE HEAD
===================================================== */

function Head({
  children,
  className = "",
}: {
  children: ReactNode;

  className?: string;
}) {
  return (
    <th
      className={`px-2 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:px-3 xl:text-xs ${className}`}
    >
      {children}
    </th>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: SaleStatus;
}) {
  const styles: Record<
    SaleStatus,
    string
  > = {
    Paid:
      "bg-emerald-50 text-emerald-700",

    Partial:
      "bg-orange-50 text-orange-700",

    Unpaid:
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold xl:px-3 xl:text-xs ${styles[status]}`}
    >
      {status}
    </span>
  );
}