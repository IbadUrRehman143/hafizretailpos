"use client";

import type { InventoryTransaction } from "./inventoryTypes";

function displayValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export default function InventoryHistory({
  transactions,
  loading,
}: {
  transactions: InventoryTransaction[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading stock history...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-bold text-slate-900">Stock History</h2>
        <p className="mt-1 text-sm text-slate-500">
          Purchase, sale, return, opening stock and manual adjustments.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Quantity</th>
              <th className="px-5 py-4">Reference</th>
              <th className="px-5 py-4">Note</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No stock history found.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
                const row = transaction as unknown as Record<string, unknown>;
                const product =
                  row.product && typeof row.product === "object"
                    ? (row.product as Record<string, unknown>)
                    : null;

                const dateText = row.createdAt
                  ? new Date(String(row.createdAt)).toLocaleString("en-PK")
                  : "-";

                const productName =
                  displayValue(row.productName) ||
                  displayValue(product?.name) ||
                  `Product #${displayValue(row.productId)}`;

                const reference =
                  row.referenceType || row.referenceId
                    ? `${displayValue(row.referenceType)}${
                        row.referenceId
                          ? ` #${displayValue(row.referenceId)}`
                          : ""
                      }`
                    : "-";

                return (
                  <tr key={displayValue(row.id)}>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {dateText}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {productName}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {displayValue(row.type)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {displayValue(row.quantity)} {displayValue(row.unit)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {reference}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {displayValue(row.note) || "-"}
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
