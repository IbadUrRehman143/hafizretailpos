"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  InventoryTransaction,
} from "./inventoryTypes";

/* =====================================================
   PROPS
===================================================== */

type InventoryHistoryProps = {
  transactions: InventoryTransaction[];
  loading: boolean;
};

/* =====================================================
   FILTER TYPES
===================================================== */

type DirectionFilter =
  | "ALL"
  | "IN"
  | "OUT";

type TypeFilter =
  | "ALL"
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "OPENING_STOCK"
  | "SALE_CANCEL";

/* =====================================================
   DATE FORMAT
===================================================== */

function formatDate(
  value: string
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-PK",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

/* =====================================================
   QUANTITY FORMAT
===================================================== */

function formatQuantity(
  quantity: number
) {
  const value =
    Number(quantity);

  if (
    !Number.isFinite(value)
  ) {
    return "0";
  }

  return value.toLocaleString(
    "en-PK",
    {
      maximumFractionDigits: 2,
    }
  );
}

/* =====================================================
   TYPE LABEL
===================================================== */

function getTypeLabel(
  type: string
) {
  switch (type) {
    case "PURCHASE":
      return "Purchase";

    case "SALE":
      return "Sale";

    case "RETURN":
      return "Return";

    case "ADJUSTMENT_IN":
      return "Adjustment In";

    case "ADJUSTMENT_OUT":
      return "Adjustment Out";

    case "OPENING_STOCK":
      return "Opening Stock";

    case "SALE_CANCEL":
      return "Sale Cancel";

    default:
      return type
        .replaceAll(
          "_",
          " "
        )
        .toLowerCase()
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );
  }
}

/* =====================================================
   TYPE BADGE
===================================================== */

function TypeBadge({
  type,
}: {
  type: string;
}) {
  const baseClass =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";

  switch (type) {
    case "PURCHASE":
      return (
        <span
          className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700`}
        >
          Purchase
        </span>
      );

    case "SALE":
      return (
        <span
          className={`${baseClass} border-red-200 bg-red-50 text-red-700`}
        >
          Sale
        </span>
      );

    case "RETURN":
      return (
        <span
          className={`${baseClass} border-blue-200 bg-blue-50 text-blue-700`}
        >
          Return
        </span>
      );

    case "ADJUSTMENT_IN":
      return (
        <span
          className={`${baseClass} border-cyan-200 bg-cyan-50 text-cyan-700`}
        >
          Adjustment In
        </span>
      );

    case "ADJUSTMENT_OUT":
      return (
        <span
          className={`${baseClass} border-orange-200 bg-orange-50 text-orange-700`}
        >
          Adjustment Out
        </span>
      );

    case "OPENING_STOCK":
      return (
        <span
          className={`${baseClass} border-slate-200 bg-slate-50 text-slate-700`}
        >
          Opening Stock
        </span>
      );

    case "SALE_CANCEL":
      return (
        <span
          className={`${baseClass} border-violet-200 bg-violet-50 text-violet-700`}
        >
          Sale Cancel
        </span>
      );

    default:
      return (
        <span
          className={`${baseClass} border-gray-200 bg-gray-50 text-gray-700`}
        >
          {getTypeLabel(
            type
          )}
        </span>
      );
  }
}

/* =====================================================
   DIRECTION BADGE
===================================================== */

function DirectionBadge({
  direction,
  quantity,
  unit,
}: {
  direction: "IN" | "OUT";
  quantity: number;
  unit: string;
}) {
  const isIn =
    direction === "IN";

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-semibold ${
        isIn
          ? "text-emerald-600"
          : "text-red-600"
      }`}
    >
      {isIn ? (
        <ArrowDownCircle
          size={17}
        />
      ) : (
        <ArrowUpCircle
          size={17}
        />
      )}

      <span>
        {isIn
          ? "+"
          : "-"}
        {formatQuantity(
          quantity
        )}{" "}
        {unit}
      </span>
    </div>
  );
}

/* =====================================================
   TABLE HEAD
===================================================== */

function TableHead({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </th>
  );
}

/* =====================================================
   INVENTORY HISTORY
===================================================== */

export default function InventoryHistory({
  transactions,
  loading,
}: InventoryHistoryProps) {
  /* =================================================
     FILTER STATE
  ================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<TypeFilter>(
    "ALL"
  );

  const [
    directionFilter,
    setDirectionFilter,
  ] = useState<DirectionFilter>(
    "ALL"
  );

  /* =================================================
     FILTERED HISTORY
  ================================================= */

  const filteredTransactions =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {
          /* ===========================================
             SEARCH
          =========================================== */

          const searchableText =
            [
              transaction.productName,
              transaction.category,
              transaction.type,
              transaction.referenceType ||
                "",
              transaction.referenceId !==
                null
                ? String(
                    transaction.referenceId
                  )
                : "",
              transaction.note ||
                "",
            ]
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !searchValue ||
            searchableText.includes(
              searchValue
            );

          /* ===========================================
             TYPE
          =========================================== */

          const matchesType =
            typeFilter ===
              "ALL" ||
            transaction.type ===
              typeFilter;

          /* ===========================================
             DIRECTION
          =========================================== */

          const matchesDirection =
            directionFilter ===
              "ALL" ||
            transaction.direction ===
              directionFilter;

          return (
            matchesSearch &&
            matchesType &&
            matchesDirection
          );
        }
      );
    }, [
      transactions,
      search,
      typeFilter,
      directionFilter,
    ]);

  /* =================================================
     FILTERED STATS
  ================================================= */

  const filteredIn =
    filteredTransactions.filter(
      (transaction) =>
        transaction.direction ===
        "IN"
    ).length;

  const filteredOut =
    filteredTransactions.filter(
      (transaction) =>
        transaction.direction ===
        "OUT"
    ).length;

  /* =================================================
     UI
  ================================================= */

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* ===============================================
          HEADER
      ================================================ */}

      <div className="border-b border-gray-200 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
              <History
                size={20}
                className="text-gray-700"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Stock History
              </h2>

              <p className="text-sm text-gray-500">
                Complete inventory
                movement history
              </p>
            </div>
          </div>

          {/* ===========================================
              MINI STATS
          ============================================ */}

          <div className="flex flex-wrap gap-2">
            <div className="rounded-lg bg-slate-100 px-3 py-2">
              <p className="text-xs text-slate-500">
                Showing
              </p>

              <p className="text-sm font-bold text-slate-800">
                {
                  filteredTransactions.length
                }
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-600">
                IN
              </p>

              <p className="text-sm font-bold text-emerald-700">
                {filteredIn}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 px-3 py-2">
              <p className="text-xs text-red-600">
                OUT
              </p>

              <p className="text-sm font-bold text-red-700">
                {filteredOut}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===============================================
          FILTERS
      ================================================ */}

      <div className="border-b border-gray-200 bg-gray-50/50 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_220px_180px]">

          {/* SEARCH */}

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search product, category, reference or note..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>

          {/* TYPE FILTER */}

          <select
            value={
              typeFilter
            }
            onChange={(
              event
            ) =>
              setTypeFilter(
                event.target
                  .value as TypeFilter
              )
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          >
            <option value="ALL">
              All Types
            </option>

            <option value="PURCHASE">
              Purchase
            </option>

            <option value="SALE">
              Sale
            </option>

            <option value="RETURN">
              Return
            </option>

            <option value="ADJUSTMENT_IN">
              Adjustment In
            </option>

            <option value="ADJUSTMENT_OUT">
              Adjustment Out
            </option>

            <option value="OPENING_STOCK">
              Opening Stock
            </option>

            <option value="SALE_CANCEL">
              Sale Cancel
            </option>
          </select>

          {/* DIRECTION FILTER */}

          <select
            value={
              directionFilter
            }
            onChange={(
              event
            ) =>
              setDirectionFilter(
                event.target
                  .value as DirectionFilter
              )
            }
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          >
            <option value="ALL">
              All Movements
            </option>

            <option value="IN">
              Stock IN
            </option>

            <option value="OUT">
              Stock OUT
            </option>
          </select>
        </div>
      </div>

      {/* ===============================================
          TABLE
      ================================================ */}

      <div className="overflow-x-auto">
        <table className="min-w-full">

          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <TableHead>
                Date
              </TableHead>

              <TableHead>
                Product
              </TableHead>

              <TableHead>
                Category
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Movement
              </TableHead>

              <TableHead>
                Reference
              </TableHead>

              <TableHead>
                Note
              </TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {/* ==========================================
                LOADING
            =========================================== */}

            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-800" />

                    <p className="text-sm text-gray-500">
                      Loading stock
                      history...
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {/* ==========================================
                EMPTY
            =========================================== */}

            {!loading &&
              filteredTransactions.length ===
                0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center"
                  >
                    <History
                      size={36}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No stock history
                      found
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {transactions.length >
                      0
                        ? "Try changing your search or filters."
                        : "Inventory movements will appear here."}
                    </p>
                  </td>
                </tr>
              )}

            {/* ==========================================
                TRANSACTIONS
            =========================================== */}

            {!loading &&
              filteredTransactions.map(
                (
                  transaction
                ) => (
                  <tr
                    key={
                      transaction.id
                    }
                    className="transition hover:bg-gray-50"
                  >

                    {/* DATE */}

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {formatDate(
                        transaction.createdAt
                      )}
                    </td>

                    {/* PRODUCT */}

                    <td className="px-4 py-3">
                      <div className="min-w-[170px]">
                        <p className="font-medium text-gray-900">
                          {
                            transaction.productName
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-gray-400">
                          Product ID:{" "}
                          {
                            transaction.productId
                          }
                        </p>
                      </div>
                    </td>

                    {/* CATEGORY */}

                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {transaction.category ||
                        "-"}
                    </td>

                    {/* TYPE */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <TypeBadge
                        type={
                          transaction.type
                        }
                      />
                    </td>

                    {/* MOVEMENT */}

                    <td className="whitespace-nowrap px-4 py-3">
                      <DirectionBadge
                        direction={
                          transaction.direction
                        }
                        quantity={
                          transaction.quantity
                        }
                        unit={
                          transaction.unit
                        }
                      />
                    </td>

                    {/* REFERENCE */}

                    <td className="px-4 py-3">
                      <div className="min-w-[130px]">
                        <p className="text-sm font-medium text-gray-700">
                          {transaction.referenceType ||
                            "-"}
                        </p>

                        {transaction.referenceId !==
                          null &&
                          transaction.referenceId !==
                            undefined && (
                            <p className="text-xs text-gray-400">
                              ID:{" "}
                              {
                                transaction.referenceId
                              }
                            </p>
                          )}
                      </div>
                    </td>

                    {/* NOTE */}

                    <td className="max-w-[280px] px-4 py-3 text-sm text-gray-500">
                      <p className="line-clamp-2">
                        {transaction.note ||
                          "-"}
                      </p>
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}