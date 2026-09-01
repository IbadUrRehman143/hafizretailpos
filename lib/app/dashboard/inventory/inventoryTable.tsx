"use client";

import type { InventoryItem } from "./inventoryTypes";
import { formatCurrency, getStockStatus } from "./inventoryUtils";

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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
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
            {inventory.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-slate-500"
                >
                  No inventory products found.
                </td>
              </tr>
            ) : (
              inventory.map((item) => {
                const status = getStockStatus(item);
                const value =
                  (Number(item.stock) || 0) *
                  (Number(item.purchasePrice) || 0);

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      {item.sku ? (
                        <div className="mt-1 text-xs text-slate-500">
                          {item.sku}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.category}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.productType === "weight"
                        ? "Weight"
                        : item.productType === "size"
                          ? "Size"
                          : "Quantity"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">
                        {item.stock} {item.unit}
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
