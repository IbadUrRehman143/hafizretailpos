"use client";

import type { InventoryItem } from "./inventoryTypes";
import { formatCurrency, getStockStatus } from "./inventoryUtils";

function ProductTypeLabel({ type }: { type: InventoryItem["productType"] }) {
  return (
    <>
      {type === "weight" ? "Weight" : type === "size" ? "Size" : "Quantity"}
    </>
  );
}

export default function InventoryTable({
  inventory,
  loading,
  onAdjust,
}: {
  inventory: InventoryItem[];
  loading: boolean;
  onAdjust: (item: InventoryItem) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Loading inventory...
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        No inventory products found.
      </div>
    );
  }

  return (
    <>
      {/* MOBILE / SMALL TABLET: cards, no horizontal page scroll */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {inventory.map((item) => {
          const status = getStockStatus(item);
          const value =
            (Number(item.stock) || 0) * (Number(item.purchasePrice) || 0);

          return (
            <div
              key={item.id}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-slate-900">
                    {item.name}
                  </p>
                  {item.sku ? (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.sku}
                    </p>
                  ) : null}
                </div>

                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Category</p>
                  <p className="mt-1 truncate font-medium text-slate-700">
                    {item.category || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Type</p>
                  <p className="mt-1 font-medium text-slate-700">
                    <ProductTypeLabel type={item.productType} />
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Stock</p>
                  <p className="mt-1 font-bold text-slate-900">
                    {Number(item.stock || 0).toLocaleString("en-PK", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    {item.unit}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Purchase Price</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {formatCurrency(Number(item.purchasePrice) || 0)}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">Stock Value</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {formatCurrency(value)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onAdjust(item)}
                className="mt-4 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Adjust Stock
              </button>
            </div>
          );
        })}
      </div>

      {/* DESKTOP: normal table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Purchase Price</th>
                <th className="px-5 py-4">Stock Value</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const status = getStockStatus(item);
                const value =
                  (Number(item.stock) || 0) * (Number(item.purchasePrice) || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.sku ? (
                        <div className="mt-1 text-xs text-slate-500">{item.sku}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{item.category}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      <ProductTypeLabel type={item.productType} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">
                        {Number(item.stock || 0).toLocaleString("en-PK", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {item.unit}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatCurrency(Number(item.purchasePrice) || 0)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {formatCurrency(value)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onAdjust(item)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
