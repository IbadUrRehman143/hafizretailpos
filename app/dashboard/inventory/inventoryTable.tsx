import {
  Loader2,
  Package,
} from "lucide-react";

import type {
  InventoryItem,
  StockStatus,
  StockType,
} from "./inventoryTypes";

import {
  formatCurrency,
  getStockStatus,
} from "./inventoryUtils";

/* =====================================================
   PROPS
===================================================== */

type InventoryTableProps = {
  inventory: InventoryItem[];
  loading: boolean;

  onAdjust: (
    item: InventoryItem
  ) => void;
};

/* =====================================================
   INVENTORY TABLE
===================================================== */

export default function InventoryTable({
  inventory,
  loading,
  onAdjust,
}: InventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">

          {/* =============================================
              TABLE HEADER
          ============================================= */}

          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <TableHead>
                Product
              </TableHead>

              <TableHead>
                SKU
              </TableHead>

              <TableHead>
                Category
              </TableHead>

              <TableHead>
                Type
              </TableHead>

              <TableHead>
                Stock
              </TableHead>

              <TableHead>
                Purchase
              </TableHead>

              <TableHead>
                Selling
              </TableHead>

              <TableHead>
                Stock Value
              </TableHead>

              <TableHead>
                Status
              </TableHead>

              <TableHead>
                Action
              </TableHead>
            </tr>
          </thead>

          {/* =============================================
              TABLE BODY
          ============================================= */}

          <tbody className="divide-y divide-slate-100">

            {/* =========================================
                LOADING
            ========================================= */}

            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-16"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Loader2
                      size={32}
                      className="animate-spin text-blue-600"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-600">
                      Loading inventory...
                    </p>
                  </div>
                </td>
              </tr>
            ) : inventory.length ===
              0 ? (

              /* =========================================
                 EMPTY
              ========================================= */

              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-16 text-center"
                >
                  <Package
                    size={36}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 font-semibold text-slate-700">
                    No inventory items found.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Try changing your search or filters.
                  </p>
                </td>
              </tr>
            ) : (

              /* =========================================
                 PRODUCTS
              ========================================= */

              inventory.map(
                (item) => {
                  const status =
                    getStockStatus(
                      item
                    );

                  const stockValue =
                    item.stock *
                    item.purchasePrice;

                  return (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* PRODUCT */}

                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Low stock limit:{" "}
                          {item.lowStockLimit}{" "}
                          {item.unit}
                        </p>
                      </td>

                      {/* SKU */}

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.sku}
                        </span>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {item.category}
                      </td>

                      {/* TYPE */}

                      <td className="px-5 py-4">
                        <TypeBadge
                          type={
                            item.type
                          }
                        />
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4">
                        <p className="text-lg font-bold text-slate-900">
                          {item.stock.toLocaleString(
                            "en-PK",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {item.unit}
                        </p>
                      </td>

                      {/* PURCHASE */}

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatCurrency(
                          item.purchasePrice
                        )}

                        <p className="mt-1 text-xs text-slate-400">
                          per{" "}
                          {item.unit}
                        </p>
                      </td>

                      {/* SELLING */}

                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatCurrency(
                          item.sellingPrice
                        )}

                        <p className="mt-1 text-xs font-normal text-slate-400">
                          per{" "}
                          {item.unit}
                        </p>
                      </td>

                      {/* STOCK VALUE */}

                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {formatCurrency(
                          stockValue
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <StatusBadge
                          status={
                            status
                          }
                        />
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            onAdjust(
                              item
                            )
                          }
                          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Adjust Stock
                        </button>
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
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: StockStatus;
}) {
  const styles: Record<
    StockStatus,
    string
  > = {
    "In Stock":
      "bg-green-50 text-green-700",

    "Low Stock":
      "bg-orange-50 text-orange-700",

    "Out of Stock":
      "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   TYPE BADGE
===================================================== */

function TypeBadge({
  type,
}: {
  type: StockType;
}) {
  const styles: Record<
    StockType,
    string
  > = {
    Weight:
      "bg-blue-50 text-blue-700",

    Quantity:
      "bg-emerald-50 text-emerald-700",

    Size:
      "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[type]}`}
    >
      {type}
    </span>
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
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}